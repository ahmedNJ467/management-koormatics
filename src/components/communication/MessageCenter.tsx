import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, Paperclip, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface DriverItem {
  id: string;
  name: string;
  license_number?: string | null;
  contact?: string | null;
}

interface TripRow {
  id: string;
  driver_id: string;
  date?: string | null;
  status?: string | null;
}

interface MessageRow {
  id: string;
  sender_type: "admin" | "driver" | "client";
  sender_name: string;
  message: string;
  timestamp: string;
  trip_id: string;
  is_read: boolean;
}

export function MessageCenter() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [driverTrips, setDriverTrips] = useState<TripRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load drivers on mount
  useEffect(() => {
    const loadDrivers = async () => {
      setLoadingDrivers(true);
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id, name, license_number, contact")
          .order("name", { ascending: true });
        if (error) throw error;
        setDrivers(data as any[] as DriverItem[]);
      } catch (e) {
        console.error("Error loading drivers", e);
        toast({
          title: "Error",
          description: "Failed to load drivers. Please refresh the page.",
          variant: "destructive",
        });
        setDrivers([]);
      } finally {
        setLoadingDrivers(false);
      }
    };
    loadDrivers();
  }, [toast]);

  // Load driver context and set up real-time subscription
  useEffect(() => {
    if (!selectedDriverId) {
      setMessages([]);
      setDriverTrips([]);
      return;
    }

    let messageChannel: any = null;
    let tripsChannel: any = null;

    const loadDriverContext = async () => {
      setLoading(true);
      try {
        // Get this driver's trips (recent first)
        const { data: trips, error: tripsError } = await supabase
          .from("trips")
          .select("id, driver_id, date, status")
          .eq("driver_id", selectedDriverId as any)
          .order("date", { ascending: false });
        if (tripsError) throw tripsError;

        const tripRows = trips as any[] as TripRow[];
        setDriverTrips(tripRows);

        const tripIds = tripRows.map((t) => t.id).filter(Boolean);
        if (tripIds.length === 0) {
          setMessages([]);
          setLoading(false);
          return;
        }

        // Load initial messages
        const { data: msgs, error: msgsError } = await supabase
          .from("trip_messages")
          .select("*")
          .in("trip_id", tripIds as any)
          .order("timestamp", { ascending: true });
        if (msgsError) throw msgsError;
        setMessages(msgs as any[] as MessageRow[]);

        // Mark messages as read
        const unreadMessageIds = (msgs as any[])
          .filter((m) => !m.is_read && m.sender_type !== "admin")
          .map((m) => m.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from("trip_messages")
            .update({ is_read: true })
            .in("id", unreadMessageIds);
        }

        // Set up real-time subscription for messages
        messageChannel = supabase
          .channel(`trip_messages_${selectedDriverId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "trip_messages",
              filter: `trip_id=in.(${tripIds.join(",")})`,
            },
            async (payload) => {
              console.log("Message update:", payload);
              
              if (payload.eventType === "INSERT") {
                // New message received
                const newMsg = payload.new as any;
                setMessages((prev) => {
                  // Check if message already exists
                  if (prev.some((m) => m.id === newMsg.id)) {
                    return prev;
                  }
                  return [...prev, newMsg].sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime()
                  );
                });

                // Mark as read if it's not from admin
                if (newMsg.sender_type !== "admin") {
                  await supabase
                    .from("trip_messages")
                    .update({ is_read: true })
                    .eq("id", newMsg.id);
                }
              } else if (payload.eventType === "UPDATE") {
                // Message updated (e.g., read status)
                const updatedMsg = payload.new as any;
                setMessages((prev) =>
                  prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
                );
              }
            }
          )
          .subscribe();

        // Set up real-time subscription for trips (in case new trips are created)
        tripsChannel = supabase
          .channel(`driver_trips_${selectedDriverId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "trips",
              filter: `driver_id=eq.${selectedDriverId}`,
            },
            async () => {
              // Reload trips when they change
              const { data: updatedTrips, error: tripsError } = await supabase
                .from("trips")
                .select("id, driver_id, date, status")
                .eq("driver_id", selectedDriverId as any)
                .order("date", { ascending: false });
              if (!tripsError && updatedTrips) {
                setDriverTrips(updatedTrips as any[] as TripRow[]);
                
                // Reload messages if trip list changed
                const updatedTripIds = updatedTrips.map((t) => t.id).filter(Boolean);
                if (updatedTripIds.length > 0) {
                  const { data: updatedMsgs } = await supabase
                    .from("trip_messages")
                    .select("*")
                    .in("trip_id", updatedTripIds as any)
                    .order("timestamp", { ascending: true });
                  if (updatedMsgs) {
                    setMessages(updatedMsgs as any[] as MessageRow[]);
                  }
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.error("Error loading driver chat context", e);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
        setMessages([]);
        setDriverTrips([]);
      } finally {
        setLoading(false);
      }
    };

    loadDriverContext();

    // Cleanup subscriptions
    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
      if (tripsChannel) {
        supabase.removeChannel(tripsChannel);
      }
    };
  }, [selectedDriverId, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const latestActiveTripId = useMemo(() => {
    if (!driverTrips || driverTrips.length === 0) return null;
    const inProgress = driverTrips.find((t) => t.status === "in_progress");
    if (inProgress) return inProgress.id;
    const scheduled = driverTrips.find((t) => t.status === "scheduled");
    if (scheduled) return scheduled.id;
    return driverTrips[0]?.id || null;
  }, [driverTrips]);

  const groupedMessages = useMemo(() => {
    const groups: Record<string, MessageRow[]> = {};
    for (const m of messages) {
      const key = format(new Date(m.timestamp), "dd.MM.yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [messages]);

  const filteredDrivers = useMemo(() => {
    const term = driverSearch.trim().toLowerCase();
    if (!term) return drivers;
    return drivers.filter((d) =>
      [d.name, d.license_number || ""].some((v) =>
        (v || "").toLowerCase().includes(term)
      )
    );
  }, [drivers, driverSearch]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDriverId || !latestActiveTripId) return;
    
    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);
    
    try {
      const payload = {
        trip_id: latestActiveTripId,
        sender_type: "admin" as const,
        sender_name: "Fleet Manager",
        message: messageText,
        timestamp: new Date().toISOString(),
        is_read: false,
      };
      
      const { error } = await supabase
        .from("trip_messages")
        .insert(payload as any);
        
      if (error) throw error;
      
      // Send SMS if enabled and driver has phone number
      let smsSuccess = false;
      if (sendSMS) {
        const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
        const phoneNumber = selectedDriver?.contact;
        
        if (phoneNumber) {
          try {
            const { error: smsError } = await supabase.functions.invoke("send-sms", {
              body: {
                to: phoneNumber,
                message: messageText,
                driver_id: selectedDriverId,
                trip_id: latestActiveTripId,
              },
            });
            
            if (!smsError) {
              smsSuccess = true;
            } else {
              console.error("SMS error:", smsError);
            }
          } catch (smsErr: any) {
            console.error("SMS error:", smsErr);
          }
        }
      }
      
      // Show success toast
      if (sendSMS) {
        if (smsSuccess) {
          toast({
            title: "Message sent",
            description: "Message sent in app and via SMS.",
          });
        } else {
          const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
          const phoneNumber = selectedDriver?.contact;
          toast({
            title: "Message sent",
            description: phoneNumber
              ? "Message sent in app, but SMS failed to send."
              : "Message sent in app. No phone number found for SMS.",
            variant: "default",
          });
        }
      }
      
      // Message will appear via real-time subscription
      // But we can also manually add it for instant feedback
      const optimisticMessage: MessageRow = {
        id: `temp-${Date.now()}`,
        ...payload,
        trip_id: latestActiveTripId,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (e: any) {
      console.error("Error sending message", e);
      setNewMessage(messageText); // Restore message on error
      toast({
        title: "Error",
        description: e.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div className="h-full w-full flex">
      {/* Left Sidebar - Drivers List */}
      <div className="w-full lg:w-1/3 border-r bg-card flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Drivers List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loadingDrivers ? (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {driverSearch ? "No drivers found" : "No drivers available"}
            </div>
          ) : (
            <div>
              {filteredDrivers.map((d) => {
                const isActive = selectedDriverId === d.id;
                return (
                  <div
                    key={d.id}
                    className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedDriverId(d.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="text-sm">
                          {d.name?.[0]?.toUpperCase() || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {d.name}
                        </div>
                        {d.license_number && (
                          <div className="text-xs text-muted-foreground truncate">
                            {d.license_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background">
        {!selectedDriverId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Select a driver to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b px-4 py-3 flex-shrink-0 bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {selectedDriver?.name?.[0]?.toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{selectedDriver?.name}</div>
                  {selectedDriver?.license_number && (
                    <div className="text-xs text-muted-foreground">
                      {selectedDriver.license_number}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                      No messages yet. Start a conversation!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {Object.entries(groupedMessages).map(([dateKey, items]) => (
                    <div key={dateKey} className="space-y-3">
                      {/* Date Separator */}
                      <div className="flex items-center justify-center py-2">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {dateKey}
                        </span>
                      </div>

                      {/* Messages */}
                      {items.map((m) => {
                        const isAdmin = m.sender_type === "admin";
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isAdmin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {!isAdmin && (
                                <div className="text-xs font-medium mb-1 opacity-80">
                                  {m.sender_name}
                                </div>
                              )}
                              <div className="text-sm whitespace-pre-wrap break-words">
                                {m.message}
                              </div>
                              <div
                                className={`mt-1 text-xs opacity-70 ${
                                  isAdmin ? "text-right" : "text-left"
                                }`}
                              >
                                {format(new Date(m.timestamp), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t bg-background p-4 flex-shrink-0">
              <div className="space-y-2 max-w-4xl mx-auto">
                {/* SMS Toggle */}
                {selectedDriver && selectedDriver.contact && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSendSMS(!sendSMS)}
                      className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                        sendSMS
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Also send as SMS</span>
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    disabled={!latestActiveTripId}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    placeholder={
                      latestActiveTripId
                        ? "Type a message..."
                        : "No active trip found for this driver"
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[36px] max-h-[120px] resize-none"
                    disabled={!latestActiveTripId}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        if (!sending && newMessage.trim() && latestActiveTripId) {
                          sendMessage();
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={
                      !newMessage.trim() ||
                      !selectedDriverId ||
                      !latestActiveTripId ||
                      sending
                    }
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
