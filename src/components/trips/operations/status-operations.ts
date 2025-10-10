import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

import { cacheInvalidationManager } from "@/lib/cache-invalidation";

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
    const updatePayload: Record<string, any> = { status };
    // If marking completed and there's no actual end/dropoff time, stamp it now
    if (
      status === "completed" &&
      !(viewTrip?.actual_dropoff_time || viewTrip?.actual_end_time)
    ) {
      updatePayload.actual_dropoff_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from("trips")
      .update(updatePayload as any)
      .eq("id", tripId as any);

    if (error) throw error;

    toast({
      title: "Trip updated",
      description: `Trip status changed to ${
        status.replace(/_/g, " ").charAt(0).toUpperCase() +
        status.replace(/_/g, " ").slice(1)
      }`,
    });

    // Mark that recent updates have occurred for cache clearing
    cacheInvalidationManager.markRecentUpdates();

    // If the status is being changed to cancelled, we need to be extra aggressive
    // about clearing caches to ensure vehicle availability is immediately updated
    if (status === "cancelled") {
      // Use the cache invalidation manager for comprehensive clearing
      await cacheInvalidationManager.clearAllCaches();

      // Then refetch everything
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
        queryClient.refetchQueries({ queryKey: ["drivers"] }),
        queryClient.refetchQueries({ queryKey: ["clients"] }),
      ]);
    } else {
      // For other status changes, use the cache invalidation manager
      await cacheInvalidationManager.invalidateAndRefetch([
        ["trips"],
        ["vehicles"],
        ["drivers"],
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
