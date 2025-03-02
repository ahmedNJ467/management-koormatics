
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, convertToDisplayTrips } from "@/lib/types/trip";
import { useEffect } from "react";

export function useTripsQuery() {
  const queryClient = useQueryClient();

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("trips-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trips" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, type),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      // Convert to DisplayTrip objects
      return convertToDisplayTrips(data);
    },
  });
}

export function useTripMessagesQuery(tripId: string | null) {
  const queryClient = useQueryClient();

  // Setup real-time subscription for messages
  useEffect(() => {
    if (!tripId) return;
    
    const channel = supabase
      .channel("trip-messages-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["tripMessages", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tripId]);

  return useQuery({
    queryKey: ["tripMessages", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useTripAssignmentsQuery(tripId: string | null) {
  return useQuery({
    queryKey: ["tripAssignments", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(`
          *,
          drivers:driver_id(name, avatar_url)
        `)
        .eq("trip_id", tripId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.drivers?.name,
        driver_avatar: assignment.drivers?.avatar_url
      }));
    },
    enabled: !!tripId,
  });
}
