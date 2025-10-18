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
    const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const trip of trips) {
      if (trip.status !== "scheduled") continue;

      const { date: tripDate, time: tripTime } = trip;
      if (!tripDate || !tripTime) continue;

      const tripDateTime = new Date(`${tripDate}T${tripTime}`);

      // Continue if the date is invalid
      if (isNaN(tripDateTime.getTime())) {
        console.warn(
          `Invalid date/time for trip ${trip.id}: ${tripDate} ${tripTime}`
        );
        continue;
      }

      const timeDifference = now.getTime() - tripDateTime.getTime();

      // Overdue handling removed per requirements
    }

    // No refresh needed
  };

  useEffect(() => {
    if (trips.length === 0) return;

    // Overdue monitoring disabled
  }, [trips.length]);

  return { checkOverdueTrips };
}
