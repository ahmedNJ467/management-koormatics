import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTripsData } from "@/hooks/use-trips-data";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { DispatchHeader } from "@/components/dispatch/DispatchHeader";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { CompleteTripDialog } from "@/components/dispatch/CompleteTripDialog";
import { logActivity } from "@/utils/activity-logger";
import { useOverdueTrips } from "@/hooks/use-overdue-trips";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoiceForTrip } from "@/lib/invoice-utils";

export default function Dispatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trips = [], isLoading, drivers = [], vehicles = [] } = useTripsData();
  
  // State for dialogs
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [completeTripOpen, setCompleteTripOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [tripToComplete, setTripToComplete] = useState<DisplayTrip | null>(null);
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

  const handleUpdateTripStatus = async (tripId: string, status: TripStatus) => {
    const { error } = await supabase
      .from("trips")
      .update({ status })
      .eq("id", tripId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update trip status.",
        variant: "destructive",
      });
      console.error("Error updating trip status:", error);
    } else {
      toast({
        title: "Success",
        description: `Trip status updated to ${status.replace("_", " ")}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    }
  };

  const handleConfirmCompleteTrip = async (trip: DisplayTrip, logSheet: File) => {
    // 1. Upload file
    const fileExt = logSheet.name.split(".").pop();
    const fileName = `${trip.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("log_sheets")
      .upload(filePath, logSheet);

    if (uploadError) {
      throw new Error(`Failed to upload log sheet: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from("log_sheets")
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      throw new Error("Could not get public URL for the uploaded file.");
    }
    const log_sheet_url = urlData.publicUrl;

    // 3. Update trip status and log sheet URL
    const { error: tripUpdateError } = await supabase
      .from("trips")
      .update({ status: "completed", log_sheet_url })
      .eq("id", trip.id);

    if (tripUpdateError) {
      throw new Error(`Failed to update trip: ${tripUpdateError.message}`);
    }
    
    // 4. Generate invoice
    try {
      await generateInvoiceForTrip({ ...trip, status: "completed", log_sheet_url });
      toast({
        title: "Trip Completed",
        description: "Log sheet uploaded, trip marked as completed, and invoice generated.",
      });
    } catch (invoiceError: any) {
      toast({
        title: "Trip Completed, Invoice Failed",
        description: `Trip marked as completed, but invoice generation failed: ${invoiceError.message}`,
        variant: "destructive",
      });
    }

    // 5. Invalidate queries and close dialog
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    // Invalidate invoices too, if you have an invoices page
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setCompleteTripOpen(false);
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
        onCompleteTrip={(trip) => {
          setTripToComplete(trip);
          setCompleteTripOpen(true);
        }}
        onUpdateStatus={handleUpdateTripStatus}
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

      <CompleteTripDialog
        open={completeTripOpen}
        trip={tripToComplete}
        onClose={() => setCompleteTripOpen(false)}
        onConfirm={handleConfirmCompleteTrip}
      />
    </div>
  );
}
