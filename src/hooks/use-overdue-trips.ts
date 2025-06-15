
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DisplayTrip } from "@/lib/types/trip";
import { createAlert } from "@/utils/alert-manager";

export function useOverdueTrips(trips: DisplayTrip[] = []) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkOverdueTrips = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    for (const trip of trips) {
      if (trip.status !== 'scheduled') continue;

      const tripDate = trip.date;
      const tripTime = trip.time;

      if (!tripDate || !tripTime) continue;

      // Check if trip is overdue (past scheduled date/time)
      const isOverdue = tripDate < today || 
        (tripDate === today && tripTime < currentTime);

      if (isOverdue) {
        try {
          // Update trip status to indicate it's overdue
          const { error: updateError } = await supabase
            .from("trips")
            .update({ 
              status: 'cancelled', // Mark as cancelled since it's missed
              notes: trip.notes ? 
                `${trip.notes}\n\nAutomatically marked as missed - trip was overdue.` : 
                'Automatically marked as missed - trip was overdue.'
            })
            .eq("id", trip.id);

          if (updateError) {
            console.error("Error updating overdue trip:", updateError);
            continue;
          }

          // Create an alert for the missed trip
          await createAlert({
            title: `Missed trip - ${trip.client_name}`,
            priority: 'high',
            type: 'trip',
            description: `Trip scheduled for ${tripDate} at ${tripTime} was not completed and has been marked as missed. Pickup: ${trip.pickup_location || 'Not specified'}, Dropoff: ${trip.dropoff_location || 'Not specified'}`,
            relatedId: trip.id,
            relatedType: 'trip'
          });

          console.log(`Trip ${trip.id} marked as missed - was overdue`);

        } catch (error) {
          console.error("Error processing overdue trip:", error);
        }
      }
    }

    // Refresh trips data after processing
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  useEffect(() => {
    if (trips.length === 0) return;

    // Check for overdue trips on mount and every 5 minutes
    checkOverdueTrips();
    
    const interval = setInterval(checkOverdueTrips, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [trips.length]); // Only depend on trips length to avoid excessive re-runs

  return { checkOverdueTrips };
}
