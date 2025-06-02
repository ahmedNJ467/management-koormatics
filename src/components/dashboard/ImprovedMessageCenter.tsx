
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, Users, Search, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  client_name?: string;
  status: string;
}

export function ImprovedMessageCenter() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchTrips();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
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
          status,
          drivers!inner(name),
          clients(name)
        `)
        .in('status', ['scheduled', 'in_progress', 'confirmed'])
        .order('date', { ascending: true })
        .limit(20);

      if (error) throw error;
      
      const formattedTrips = data?.map(trip => ({
        id: trip.id,
        pickup_location: trip.pickup_location || 'Unknown Location',
        dropoff_location: trip.dropoff_location || 'Unknown Destination',
        date: trip.date,
        status: trip.status,
        driver_name: (trip.drivers as any)?.name || 'Unassigned',
        client_name: (trip.clients as any)?.name || 'Unknown Client'
      })) || [];

      setTrips(formattedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
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
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTripMessages = messages.filter(msg => msg.trip_id === selectedTrip);
  const unreadCount = messages.filter(msg => !msg.is_read && msg.sender_type !== 'admin').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <MessageCircle className="w-12 h-12 mb-3" />
        <h3 className="font-medium text-lg mb-1">No Active Trips</h3>
        <p className="text-center text-sm">No trips available for communication at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[450px]">
      {/* Trip List */}
      <div className="lg:col-span-2 border rounded-lg overflow-hidden bg-card">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium text-sm">Active Trips ({filteredTrips.length})</span>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {filteredTrips.map((trip) => {
            const tripMessages = messages.filter(msg => msg.trip_id === trip.id);
            const hasUnread = tripMessages.some(msg => !msg.is_read && msg.sender_type !== 'admin');
            
            return (
              <div
                key={trip.id}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTrip === trip.id ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
                onClick={() => setSelectedTrip(trip.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate text-xs">
                        {trip.pickup_location} → {trip.dropoff_location}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(trip.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Driver: {trip.driver_name}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                  {hasUnread && (
                    <div className="h-2 w-2 bg-primary rounded-full mt-1"></div>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="lg:col-span-3 border rounded-lg overflow-hidden bg-card">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium text-sm">
              {selectedTrip ? 'Trip Communication' : 'Select a Trip'}
            </span>
          </div>
        </div>
        
        {selectedTrip ? (
          <div className="flex flex-col h-[390px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {selectedTripMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTripMessages.reverse().map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 text-sm ${
                          message.sender_type === 'admin'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {message.sender_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium">{message.sender_name}</p>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {format(new Date(message.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
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
                  size="sm"
                  className="self-end h-[60px] px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[390px] text-muted-foreground text-sm">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a trip from the list to view and send messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
