import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseFieldsToTrip } from "@/lib/types/trip";
import { DbTripData } from "@/components/trips/types";
import { Driver, Vehicle, Client } from "@/lib/types";

export function useTripsData() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Fetch trips data
  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `
          *,
          clients:client_id(name, email, type),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;

      // Type assertion to help TypeScript understand the structure
      return data.map((trip: any) => {
        return mapDatabaseFieldsToTrip(trip);
      });
    },
  });

  // Fetch clients, vehicles, and drivers for forms
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, type")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration, type")
        .eq("status", "active")
        .order("make");
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const driversQuery = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, avatar_url, contact")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Driver[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    // Only create subscription if one doesn't already exist
    if (!channelRef.current) {
      const channelName = `trips-data-${Date.now()}-${Math.random()}`;
      channelRef.current = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "trips" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return {
    trips: tripsQuery.data,
    isLoading: tripsQuery.isLoading,
    clients: clientsQuery.data,
    vehicles: vehiclesQuery.data,
    drivers: driversQuery.data,
  };
}
