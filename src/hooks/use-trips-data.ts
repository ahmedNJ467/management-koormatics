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
      // Try with escort fields first, fallback to basic fields if they don't exist
      try {
        console.log("🚗 Fetching vehicles with escort fields...");
        const { data, error } = await supabase
          .from("vehicles")
          .select(
            "id, make, model, registration, type, status, is_escort_assigned, escort_trip_id, escort_assigned_at"
          )
          .order("make");

        if (error) {
          console.error(
            "❌ Error fetching vehicles with escort fields:",
            error
          );
          throw error;
        }

        console.log("✅ Successfully fetched vehicles with escort fields:", {
          count: data?.length || 0,
          sample:
            data?.slice(0, 2).map((v) => ({
              id: v.id,
              make: v.make,
              model: v.model,
              registration: v.registration,
              status: v.status,
              is_escort_assigned: v.is_escort_assigned,
              escort_trip_id: v.escort_trip_id,
            })) || [],
          escortAssignedCount:
            data?.filter((v) => v.is_escort_assigned)?.length || 0,
          statusBreakdown:
            data?.reduce((acc, v) => {
              acc[v.status] = (acc[v.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {},
        });

        return data as Vehicle[];
      } catch (error) {
        // Fallback to basic fields if escort fields don't exist yet
        console.warn(
          "⚠️ Escort fields not found in vehicles table, using basic query:",
          error
        );
        const { data, error: fallbackError } = await supabase
          .from("vehicles")
          .select("id, make, model, registration, type, status")
          .order("make");

        if (fallbackError) {
          console.error("❌ Fallback query also failed:", fallbackError);
          throw fallbackError;
        }

        console.log("✅ Fallback query successful:", {
          count: data?.length || 0,
          sample: data?.slice(0, 2) || [],
        });

        // Add default escort fields to maintain compatibility
        return data.map((vehicle) => ({
          ...vehicle,
          is_escort_assigned: false,
          escort_trip_id: null,
          escort_assigned_at: null,
        })) as Vehicle[];
      }
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
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
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
