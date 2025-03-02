
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

// Update trip status
export const updateTripStatus = async (
  tripId: string, 
  status: TripStatus, 
  viewTrip: DisplayTrip | null, 
  setViewTrip: (trip: DisplayTrip | null) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  try {
    // Note: We only update a custom status field in our app, not in DB schema
    const { error } = await supabase
      .from("trips")
      .update({ 
        // Store status in notes with a prefix instead of special_instructions
        notes: `STATUS:${status}${
          viewTrip?.notes ? 
            `\n\n${viewTrip.notes.replace(/^STATUS:[a-z_]+\n\n/i, '')}` : 
            ''
        }`
      })
      .eq("id", tripId);

    if (error) throw error;

    toast({
      title: "Trip updated",
      description: `Trip status changed to ${status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}`,
    });

    queryClient.invalidateQueries({ queryKey: ["trips"] });
    
    // Update local viewTrip state if it's the current trip
    if (viewTrip && viewTrip.id === tripId) {
      setViewTrip({...viewTrip, status});
    }
  } catch (error) {
    console.error("Error updating trip status:", error);
    toast({
      title: "Error",
      description: "Failed to update trip status",
      variant: "destructive",
    });
  }
};
