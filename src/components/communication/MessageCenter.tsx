
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  timestamp: string;
  trip_id?: string;
  is_read: boolean;
}

interface Trip {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  driver_name?: string;
}

export function MessageCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchTrips();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          date,
          drivers(name)
        `)
        .eq('status', 'in_progress')
        .order('date', { ascending: true });

      if (error) throw error;
      
      const formattedTrips = data?.map(trip => ({
        id: trip.id,
        pickup_location: trip.pickup_location || '',
        dropoff_location: trip.dropoff_location || '',
        date: trip.date,
        driver_name: (trip.drivers as any)?.name || 'Unassigned'
      })) || [];

      setTrips(formattedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTrip) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('trip_messages')
        .insert({
          trip_id: selectedTrip,
          sender_type: 'admin',
          sender_name: 'Fleet Manager',
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          is_read: false
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTripMessages = messages.filter(msg => msg.trip_id === selectedTrip);
  const unreadCount = messages.filter(msg => !msg.is_read && msg.sender_type === 'driver').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Trip List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Trips
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            {filteredTrips.map((trip) => {
              const tripMessages = messages.filter(msg => msg.trip_id === trip.id);
              const hasUnread = tripMessages.some(msg => !msg.is_read && msg.sender_type === 'driver');
              
              return (
                <div
                  key={trip.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedTrip === trip.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedTrip(trip.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {trip.pickup_location} → {trip.dropoff_location}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(trip.date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Driver: {trip.driver_name}
                      </div>
                    </div>
                    {hasUnread && (
                      <div className="h-2 w-2 bg-red-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Area */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {selectedTrip ? 'Trip Communication' : 'Select a Trip'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedTrip ? (
            <div className="flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {selectedTripMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTripMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender_type === 'admin'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {message.sender_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium">{message.sender_name}</p>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(message.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Select a trip from the list to view and send messages
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
