
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

// Handle sending a message
export const handleSendMessage = async (
  tripToMessage: DisplayTrip | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  if (!tripToMessage || !newMessage.trim()) return;
  
  try {
    // Skip the RPC and use direct insertion
    const { error } = await supabase.from('trip_messages').insert({
      trip_id: tripToMessage.id,
      sender_type: "admin",
      sender_name: "Fleet Manager", // In a real app, use the current user's name
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_read: false
    });
    
    if (error) throw error;
    
    toast({
      title: "Message sent",
      description: "Your message has been sent",
    });
    
    setNewMessage("");
    queryClient.invalidateQueries({ queryKey: ["tripMessages", tripToMessage.id] });
  } catch (error) {
    console.error("Error sending message:", error);
    toast({
      title: "Error",
      description: "Failed to send message",
      variant: "destructive",
    });
  }
};
