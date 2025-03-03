
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TripItemProps } from "@/types/dashboard";
import { initialTrips } from "@/data/dashboard/mock-data";

export function useTripsData() {
  const [upcomingTrips, setUpcomingTrips] = useState<TripItemProps[]>(initialTrips);

  // Fetch upcoming trips
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["dashboard", "trips"],
    queryFn: async () => {
      try {
        // Get the current date
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedNextWeek = nextWeek.toISOString().split('T')[0];
        
        // Fetch upcoming trips
        const { data, error } = await supabase
          .from("trips")
          .select(`
            id, date, time, 
            pickup_location, dropoff_location,
            clients(name),
            drivers(name)
          `)
          .gte("date", formattedToday)
          .lte("date", formattedNextWeek)
          .order("date", { ascending: true })
          .limit(5);
        
        if (error) throw error;
        
        // Format trips data
        const formattedTrips: TripItemProps[] = data.map(trip => ({
          id: parseInt(trip.id, 10) || Math.floor(Math.random() * 1000000), // Fallback to random number if parsing fails
          client: trip.clients?.name || 'Unknown Client',
          destination: trip.dropoff_location || 'Not specified',
          date: `${trip.date} ${trip.time || ''}`.trim(),
          driver: trip.drivers?.name || 'Not Assigned'
        }));
        
        // Update upcoming trips state
        setUpcomingTrips(formattedTrips);
        
        return formattedTrips;
      } catch (error) {
        console.error("Error fetching trips data:", error);
        toast.error("Failed to load upcoming trips");
        return [];
      }
    },
  });

  return { upcomingTrips, isLoadingTrips };
}
