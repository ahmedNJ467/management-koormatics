
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { TripMessage } from "@/lib/types/trip";

interface MessagesTabProps {
  messages: TripMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
}

export function MessagesTab({ 
  messages, 
  newMessage, 
  setNewMessage, 
  handleSendMessage 
}: MessagesTabProps) {
  const formatTimestamp = (timestamp: string): string => {
    return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No messages yet
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
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
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
            className="ml-auto"
          >
            Send Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
