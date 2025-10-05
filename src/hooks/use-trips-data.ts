import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseFieldsToTrip } from "@/lib/types/trip";
import { DbTripData } from "@/components/trips/types";
import { Driver, Vehicle, Client } from "@/lib/types";

export function useTripsData() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const enableRealtime =
    typeof window !== "undefined" &&
    (String(
      process.env.NEXT_PUBLIC_ENABLE_REALTIME || "false"
    ).toLowerCase() === "true" ||
      String(process.env.NEXT_PUBLIC_ENABLE_REALTIME).trim() === "1");

  // Fetch trips data
  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `
          *,
          clients!trips_client_id_fkey(name, email, type),
          vehicles!trips_vehicle_id_fkey(make, model, registration),
          drivers!trips_driver_id_fkey(name, contact, avatar_url)
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;

      // Type assertion to help TypeScript understand the structure
      // Auto-progress trips: if scheduled and start time has passed, mark in_progress
      const now = new Date();
      const mapped = data.map((trip: any) => mapDatabaseFieldsToTrip(trip));

      // Overlay driver assignments from trip_assignments so availability is accurate
      try {
        const { data: assigns, error: assignsError } = await supabase
          .from("trip_assignments")
          .select("trip_id, driver_id");
        if (!assignsError && assigns) {
          const byTrip = assigns.reduce((acc: any, a: any) => {
            (acc[a.trip_id] ||= []).push(a.driver_id);
            return acc;
          }, {} as Record<string, string[]>);
          for (const t of mapped) {
            t.assigned_driver_ids =
              byTrip[t.id] || (t.driver_id ? [t.driver_id] : []);
          }
        }
      } catch {}
      const toProgress = mapped.filter((t) => {
        if (t.status !== "scheduled" || !t.date || !t.time) return false;
        const start = new Date(`${t.date}T${t.time}`);
        return start <= now;
      });

      if (toProgress.length > 0) {
        const ids = toProgress.map((t) => t.id);
        try {
          await supabase
            .from("trips")
            .update({ status: "in_progress" })
            .in("id", ids);
          // update local mapped copy as well
          for (const t of mapped) {
            if (ids.includes(t.id)) t.status = "in_progress" as any;
          }
        } catch (e) {
          console.warn("Auto-progress trips failed", e);
        }
      }

      return mapped;
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
            data?.slice(0, 2).map((v: any) => ({
              id: v.id,
              make: v.make,
              model: v.model,
              registration: v.registration,
              status: v.status,
              is_escort_assigned: v.is_escort_assigned,
              escort_trip_id: v.escort_trip_id,
            })) || [],
          escortAssignedCount:
            data?.filter((v: any) => v.is_escort_assigned)?.length || 0,
          statusBreakdown:
            data?.reduce((acc: any, v: any) => {
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
        return data.map((vehicle: any) => ({
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

  // Subscribe to real-time changes (optional)
  useEffect(() => {
    // Always call useEffect, but conditionally execute logic inside
    if (!enableRealtime) {
      return;
    }

    // Only create subscription if one doesn't already exist
    if (!channelRef.current) {
      const channelName = `trips-data-${Date.now()}-${Math.random()}`;
      try {
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
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "vehicles" },
            () => {
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              queryClient.invalidateQueries({ queryKey: ["trips"] });
            }
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime subscription skipped due to error:", e);
      }
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
    };
  }, [queryClient, enableRealtime]);

  return {
    trips: tripsQuery.data,
    isLoading: tripsQuery.isLoading,
    clients: clientsQuery.data,
    vehicles: vehiclesQuery.data,
    drivers: driversQuery.data,
  };
}
