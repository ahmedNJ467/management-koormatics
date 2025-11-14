import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

export function useTripDetails(viewTrip: DisplayTrip | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Fetch trip messages
  const messagesQuery = useQuery({
    queryKey: ["tripMessages", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];

      try {
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", viewTrip.id)
        .order("timestamp", { ascending: true });

        if (error) {
          console.warn("Trip messages fetch error", {
            tripId: viewTrip.id,
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
          });
          return [];
        }

        return (data as TripMessageData[]) || [];
      } catch (err) {
        console.error("Unexpected trip messages fetch error", {
          tripId: viewTrip.id,
          error: err,
        });
        return [];
      }
    },
    enabled: !!viewTrip,
  });

  // Fetch trip assignments
  const assignmentsQuery = useQuery({
    queryKey: ["tripAssignments", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];

      const mapAssignments = (rows: any[] = []) =>
        rows.map((assignment) => ({
          ...assignment,
          driver_name: assignment.drivers?.name,
          driver_avatar: assignment.drivers?.avatar_url,
        })) as TripAssignmentData[];

      const fetchFallbackAssignments = async () => {
        const { data, error } = await supabase
          .from("trip_assignments")
          .select("*")
          .eq("trip_id", viewTrip.id)
          .order("assigned_at", { ascending: false });

        if (error) {
          console.error("Trip assignments fallback fetch error", {
            tripId: viewTrip.id,
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
          });
          return [] as TripAssignmentData[];
        }

        return mapAssignments(data);
      };

      try {
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(
          `
          *,
          drivers:driver_id(name, avatar_url)
        `
        )
        .eq("trip_id", viewTrip.id)
        .order("assigned_at", { ascending: false });

        if (error) {
          console.warn("Trip assignments fetch error", {
            tripId: viewTrip.id,
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
          });
          return await fetchFallbackAssignments();
        }

        return mapAssignments(data);
      } catch (err) {
        console.error("Unexpected trip assignments fetch error", {
          tripId: viewTrip.id,
          error: err,
        });
        return await fetchFallbackAssignments();
      }
    },
    enabled: !!viewTrip,
  });

  // Subscribe to messages changes
  useEffect(() => {
    if (!viewTrip) {
      // Clean up existing channel if trip is null
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Only create subscription if one doesn't already exist for this trip
    if (!channelRef.current) {
      const channelName = `trip-messages-${
        viewTrip.id
      }-${Date.now()}-${Math.random()}`;
      channelRef.current = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "trip_messages",
            filter: `trip_id=eq.${viewTrip.id}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["tripMessages", viewTrip.id],
            });
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
  }, [queryClient, viewTrip?.id]); // Use viewTrip.id instead of viewTrip to prevent unnecessary re-subscriptions

  return {
    messages: messagesQuery.data,
    assignments: assignmentsQuery.data,
  };
}
