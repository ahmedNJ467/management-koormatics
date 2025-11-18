import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    }
  }, [selectedDriverId]);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full p-0 min-h-0 max-h-full">
      {/* Left - Drivers list */}
      <Card className="lg:col-span-4 flex flex-col rounded-none h-full max-h-full border-r">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 max-h-full overflow-hidden">
          <div className="p-3 border-b flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>
          <div 
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{ maxHeight: '100%' }}
          >
            {filteredDrivers.map((d) => {
              const isActive = selectedDriverId === d.id;
              return (
                <div
                  key={d.id}
                  className={`px-3 py-2 border-b cursor-pointer text-sm hover:bg-muted/50 ${
                    isActive ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedDriverId(d.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {d.name?.[0]?.toUpperCase() || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-xs">
                        {d.name}
                      </div>
                      {d.license_number && (
                        <div className="text-[11px] text-muted-foreground">
                          {d.license_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right - Thread */}
      <Card className="lg:col-span-8 flex flex-col rounded-none h-full">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4">
              {!selectedDriverId ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground min-h-[400px]">
                  Select a driver to start chatting
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground min-h-[400px]">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(groupedMessages).map(([dateKey, items]) => (
                    <div key={dateKey} className="space-y-2">
                      <div className="flex items-center justify-center">
                        <span className="text-[11px] text-muted-foreground px-2 py-0.5 border rounded-none">
                          {dateKey}
                        </span>
                      </div>
                      {items.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.sender_type === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-none px-3 py-2 text-xs ${
                              m.sender_type === "admin"
                                ? "bg-primary text-primary-foreground ml-auto"
                                : "bg-muted"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {m.message}
                            </div>
                            <div className="mt-1 opacity-70 text-[10px] text-right">
                              {format(new Date(m.timestamp), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-t p-2 flex-shrink-0 bg-background">
            <div className="flex gap-2 items-end">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[36px] max-h-[120px] resize-y text-xs"
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
                size="sm"
                className="h-8"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
