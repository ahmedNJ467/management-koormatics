import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTripsData } from "@/hooks/use-trips-data";
import { TripStatus, DisplayTrip } from "@/lib/types/trip";
import { DispatchHeader } from "@/components/dispatch/DispatchHeader";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { assignDriverToTrip } from "@/components/trips/operations/driver-operations";
import { logActivity } from "@/utils/activity-logger";
import { supabase } from "@/integrations/supabase/client";

export default function Dispatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trips, isLoading, drivers } = useTripsData();
  
  // State for dialogs
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Filter only scheduled and in_progress trips for dispatch
  const dispatchTrips = trips?.filter(trip => 
    trip.status === "scheduled" || trip.status === "in_progress"
  );

  // Handle sending a message to driver
  const handleSendMessage = async () => {
    if (!tripToMessage || !newMessage.trim()) return;
    
    try {
      // Insert message
      const { error } = await supabase.from("trip_messages").insert({
        trip_id: tripToMessage.id,
        sender_type: "admin",
        sender_name: "Dispatch",
        message: newMessage,
        timestamp: new Date().toISOString(),
        is_read: false
      });
      
      if (error) throw error;
      
      // Log activity
      await logActivity({
        title: `Message sent regarding trip to ${tripToMessage.dropoff_location || ""}`,
        type: "trip",
        relatedId: tripToMessage.id
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["tripMessages", tripToMessage.id] });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle driver assignment from dispatch
  const handleDriverAssigned = () => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["tripAssignments"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight">Dispatch</h2>
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <DispatchHeader />
      
      <DispatchBoard 
        trips={dispatchTrips || []}
        drivers={drivers || []}
        onAssignDriver={(trip) => {
          setTripToAssign(trip);
          setAssignOpen(true);
        }}
        onSendMessage={(trip) => {
          setTripToMessage(trip);
          setMessageOpen(true);
        }}
      />
      
      {/* Dialogs */}
      <AssignDriverDialog
        open={assignOpen}
        tripToAssign={tripToAssign}
        onClose={() => setAssignOpen(false)}
        onDriverAssigned={handleDriverAssigned}
      />
      
      <TripMessageDialog
        open={messageOpen}
        tripToMessage={tripToMessage}
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
        onClose={() => setMessageOpen(false)}
      />
    </div>
  );
}
