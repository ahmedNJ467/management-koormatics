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
    // Now we update the status field directly instead of storing in notes
    const { error } = await supabase
      .from("trips")
      .update({ status })
      .eq("id", tripId);

    if (error) throw error;

    toast({
      title: "Trip updated",
      description: `Trip status changed to ${
        status.replace(/_/g, " ").charAt(0).toUpperCase() +
        status.replace(/_/g, " ").slice(1)
      }`,
    });

    // If the status is being changed to cancelled, we need to be extra aggressive
    // about clearing caches to ensure vehicle availability is immediately updated
    if (status === "cancelled") {
      // Clear all query caches
      queryClient.clear();

      // Then refetch everything
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
        queryClient.refetchQueries({ queryKey: ["drivers"] }),
        queryClient.refetchQueries({ queryKey: ["clients"] }),
      ]);
    } else {
      // For other status changes, use the normal invalidation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);

      // Also refetch immediately to ensure fresh data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
      ]);
    }

    // Update local viewTrip state if it's the current trip
    if (viewTrip && viewTrip.id === tripId) {
      setViewTrip({ ...viewTrip, status });
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
