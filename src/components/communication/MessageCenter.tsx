import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DriverItem {
  id: string;
  name: string;
  license_number?: string | null;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id, name, license_number")
          .order("name", { ascending: true });
        if (error) throw error;
        setDrivers(data as any[] as DriverItem[]);
      } catch (e) {
        console.error("Error loading drivers", e);
        setDrivers([]);
      }
    };
    loadDrivers();
  }, []);

  useEffect(() => {
    const loadDriverContext = async (driverId: string) => {
      try {
        // Get this driver's trips (recent first)
        const { data: trips, error: tripsError } = await supabase
          .from("trips")
          .select("id, driver_id, date, status")
          .eq("driver_id", driverId as any)
          .order("date", { ascending: false });
        if (tripsError) throw tripsError;

        const tripRows = trips as any[] as TripRow[];
        setDriverTrips(tripRows);

        const tripIds = tripRows.map((t) => t.id).filter(Boolean);
        if (tripIds.length === 0) {
          setMessages([]);
          return;
        }

        const { data: msgs, error: msgsError } = await supabase
          .from("trip_messages")
          .select("*")
          .in("trip_id", tripIds as any)
          .order("timestamp", { ascending: true });
        if (msgsError) throw msgsError;
        setMessages(msgs as any[] as MessageRow[]);
      } catch (e) {
        console.error("Error loading driver chat context", e);
        setMessages([]);
        setDriverTrips([]);
      }
    };

    if (selectedDriverId) {
      loadDriverContext(selectedDriverId);
    } else {
      setMessages([]);
      setDriverTrips([]);
    }
  }, [selectedDriverId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
    setSending(true);
    try {
      const payload = {
        trip_id: latestActiveTripId,
        sender_type: "admin" as const,
        sender_name: "Fleet Manager",
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: false,
      };
      const { error } = await supabase
        .from("trip_messages")
        .insert(payload as any);
      if (error) throw error;
      setNewMessage("");
      // Refresh thread
      const { data: msgs } = await supabase
        .from("trip_messages")
        .select("*")
        .in("trip_id", (driverTrips || []).map((t) => t.id) as any)
        .order("timestamp", { ascending: true });
      setMessages(((msgs as any[]) || []) as MessageRow[]);
    } catch (e) {
      console.error("Error sending message", e);
    } finally {
      setSending(false);
    }
  };

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
          {filteredDrivers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No drivers found
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
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
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
              <div className="flex gap-2 items-end max-w-4xl mx-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[36px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
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
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
