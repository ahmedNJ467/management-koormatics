import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTripsData } from "@/hooks/use-trips-data";
import { DisplayTrip } from "@/lib/types/trip";
import { DispatchHeader } from "@/components/dispatch/DispatchHeader";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { logActivity } from "@/utils/activity-logger";
import { useOverdueTrips } from "@/hooks/use-overdue-trips";

export default function Dispatch() {
  const { toast } = useToast();
  const { trips = [], isLoading, drivers = [], vehicles = [] } = useTripsData();
  
  // State for dialogs
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Pass all trips to DispatchBoard - it will handle the filtering internally
  // Add safety check to ensure trips is an array and filter out any bad data
  const dispatchTrips = Array.isArray(trips) 
    ? trips.filter(trip => trip && typeof trip === 'object')
    : [];

  // Add overdue trip monitoring
  useOverdueTrips(dispatchTrips);

  // Handle sending a message to driver
  const handleSendMessage = async () => {
    if (!tripToMessage || !newMessage.trim()) return;
    
    try {
      // Log activity for the message sent
      logActivity({
        title: `Message sent to driver for trip ${tripToMessage.id}`,
        type: "trip",
        relatedId: tripToMessage.id.toString()
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
      
      // Log for debugging
      console.log("Message sent:", {
        trip_id: tripToMessage.id,
        message: newMessage,
        timestamp: new Date().toISOString(),
      });
      
      setNewMessage("");
      setMessageOpen(false);
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
    if (tripToAssign) {
      // Log activity for driver assignment
      logActivity({
        title: `Driver assigned to trip ${tripToAssign.id}`,
        type: "trip",
        relatedId: tripToAssign.id.toString()
      });
    }
    
    toast({
      title: "Driver assigned",
      description: "The driver has been successfully assigned to the trip",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 bg-card text-card-foreground p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight text-card-foreground">Dispatch</h2>
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in bg-card p-6 rounded-lg border border-border">
      <DispatchHeader />
      
      <DispatchBoard 
        trips={dispatchTrips}
        drivers={drivers || []}
        vehicles={vehicles || []}
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
