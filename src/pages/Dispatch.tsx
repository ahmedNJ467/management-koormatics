import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTripsData } from "@/hooks/use-trips-data";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { CompleteTripDialog } from "@/components/dispatch/CompleteTripDialog";
import { AssignEscortDialog } from "@/components/dispatch/AssignEscortDialog";

import { logActivity } from "@/utils/activity-logger";
import { useOverdueTrips } from "@/hooks/use-overdue-trips";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
// status filter removed from header
import { handleSendMessage as persistTripMessage } from "@/components/trips/operations/message-operations";

export default function Dispatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trips = [], isLoading, drivers = [], vehicles = [] } = useTripsData();

  // Add a refresh trigger state to force re-renders
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    queryClient.refetchQueries({ queryKey: ["trips"] });
    queryClient.refetchQueries({ queryKey: ["vehicles"] });
  }, [queryClient, refreshTrigger]);

  // State for dialogs
  const [messageOpen, setMessageOpen] = useState(false);
  const [completeTripOpen, setCompleteTripOpen] = useState(false);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [tripToComplete, setTripToComplete] = useState<DisplayTrip | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [assignEscortOpen, setAssignEscortOpen] = useState(false);
  const [tripToAssignEscort, setTripToAssignEscort] =
    useState<DisplayTrip | null>(null);

  // New state for enhanced features
  // status filter removed; show all trips
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // No filter persistence

  // Memoize dispatch trips to avoid dependency warnings
  const dispatchTrips = useMemo(() => {
    return Array.isArray(trips)
      ? trips.filter((trip) => trip && typeof trip === "object")
      : [];
  }, [trips]);

  // Add overdue trip monitoring
  useOverdueTrips(dispatchTrips);

  // Enhanced analytics calculations with memoized dispatchTrips
  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrips = dispatchTrips.filter((trip) => {
      if (!trip.date) return false;
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });

    const scheduledCount = dispatchTrips.filter(
      (t) => t.status === "scheduled"
    ).length;
    const inProgressCount = dispatchTrips.filter(
      (t) => t.status === "in_progress"
    ).length;
    const completedCount = dispatchTrips.filter(
      (t) => t.status === "completed"
    ).length;
    const overdueCount = dispatchTrips.filter((t) => {
      if (!t.date || !t.time) return false;
      const tripDateTime = new Date(`${t.date}T${t.time}`);
      return tripDateTime < new Date() && t.status === "scheduled";
    }).length;

    const unassignedDrivers = dispatchTrips.filter(
      (t) => !t.driver_id && t.status === "scheduled"
    ).length;
    const unassignedVehicles = dispatchTrips.filter(
      (t) => !t.vehicle_id && t.status === "scheduled"
    ).length;

    // Available = total - unique assigned to in-progress trips
    const inProgressTrips = dispatchTrips.filter(
      (t) => t.status === "in_progress"
    );
    const assignedDriverIds = new Set(
      inProgressTrips
        .map((t) => t.driver_id)
        .filter((id): id is string => Boolean(id))
    );

    const assignedVehicleIds = new Set<string>();
    for (const trip of inProgressTrips) {
      if (trip.vehicle_id) assignedVehicleIds.add(trip.vehicle_id);
      if (Array.isArray(trip.assigned_vehicle_ids)) {
        for (const vId of trip.assigned_vehicle_ids)
          assignedVehicleIds.add(vId);
      }
    }

    const availableDrivers = Math.max(
      0,
      (drivers?.length || 0) - assignedDriverIds.size
    );
    const availableVehicles = Math.max(
      0,
      (vehicles?.length || 0) - assignedVehicleIds.size
    );

    return {
      todayTrips: todayTrips.length,
      scheduledCount,
      inProgressCount,
      completedCount,
      overdueCount,
      unassignedDrivers,
      unassignedVehicles,
      availableDrivers: Math.max(0, availableDrivers),
      availableVehicles: Math.max(0, availableVehicles),
      totalRevenue: dispatchTrips.reduce(
        (sum, trip) => sum + (trip.amount || 0),
        0
      ),
      completionRate:
        scheduledCount + inProgressCount + completedCount > 0
          ? Math.round(
              (completedCount /
                (scheduledCount + inProgressCount + completedCount)) *
                100
            )
          : 0,
    };
  }, [dispatchTrips, drivers, vehicles]);

  // Show all trips (no status filter)
  const filteredTrips = useMemo(() => dispatchTrips, [dispatchTrips]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear all query caches
      queryClient.clear();

      // Then refetch everything
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
        queryClient.refetchQueries({ queryKey: ["drivers"] }),
        queryClient.refetchQueries({ queryKey: ["clients"] }),
      ]);

      // Small delay to ensure data propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force a component re-render
      setRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Refreshed",
        description: "Dispatch data has been updated",
      });
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, toast, setRefreshTrigger]);

  // Handle sending a message to driver
  const handleSendMessage = useCallback(async () => {
    await persistTripMessage(
      tripToMessage,
      newMessage,
      setNewMessage,
      (p) => toast(p),
      queryClient
    );
    setMessageOpen(false);
  }, [tripToMessage, newMessage, toast, queryClient]);

  const handleEscortAssigned = useCallback(async () => {
    // Use aggressive cache clearing and refetching to ensure UI updates
    queryClient.clear();

    // Then refetch everything
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["trips"] }),
      queryClient.refetchQueries({ queryKey: ["vehicles"] }),
      queryClient.refetchQueries({ queryKey: ["drivers"] }),
    ]);

    // Small delay to ensure data propagation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force a component re-render
    setRefreshTrigger((prev) => prev + 1);

    setAssignEscortOpen(false);
    toast({
      title: "Escort Vehicles Assigned",
      description:
        "Security escort vehicles have been successfully assigned to the trip",
    });
  }, [queryClient, toast, setRefreshTrigger]);

  const handleUpdateTripStatus = useCallback(
    async (tripId: string, status: TripStatus) => {
      try {
        const { error } = await supabase
          .from("trips")
          .update({ status })
          .eq("id", tripId);

        if (error) throw error;

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

          // Small delay to ensure data propagation
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force a component re-render
          setRefreshTrigger((prev) => prev + 1);
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

        toast({
          title: "Trip Updated",
          description: `Trip status changed to ${status}`,
        });
      } catch (error) {
        console.error("Error updating trip status:", error);
        toast({
          title: "Error",
          description: "Failed to update trip status",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast, setRefreshTrigger]
  );

  // Removed invoice generation from Dispatch; handled in Trip Finance

  const handleConfirmCompleteTrip = useCallback(
    async (trip: DisplayTrip, logSheet: File) => {
      try {
        if (!logSheet) {
          toast({
            title: "Error",
            description: "Please upload a log sheet to complete the trip.",
            variant: "destructive",
          });
          return;
        }

        const fileExt = logSheet.name.split(".").pop();
        const fileName = `${trip.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("log_sheets")
          .upload(filePath, logSheet);

        if (uploadError) {
          throw new Error(`Failed to upload log sheet: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("log_sheets")
          .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
          throw new Error("Could not get public URL for the uploaded file.");
        }
        const log_sheet_url = urlData.publicUrl;

        const { error: tripUpdateError } = await supabase
          .from("trips")
          .update({ status: "completed", log_sheet_url })
          .eq("id", trip.id);

        if (tripUpdateError) {
          throw new Error(`Failed to update trip: ${tripUpdateError.message}`);
        }

        toast({
          title: "Trip Completed",
          description: "Log sheet uploaded and trip marked as completed.",
        });

        await queryClient.invalidateQueries({ queryKey: ["trips"] });
        await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        // Invoice flow handled via Trip Finance; no invoice invalidation here
        setCompleteTripOpen(false);
      } catch (error) {
        console.error("Error completing trip:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast({
          title: "Error",
          description: `Failed to complete trip: ${errorMessage}`,
          variant: "destructive",
        });
      }
    },
    [queryClient, toast]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Dispatch</h2>
          <p className="text-sm text-muted-foreground">
            Loading dispatch data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border rounded-md p-4 bg-card animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-6 bg-muted rounded w-3/4 mt-3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="z-10 px-4 pt-0 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Operation Center
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Fleet Command & Control • {format(now, "EEEE, MMMM d, yyyy")} •
              <Clock className="h-4 w-4" />
              <span className="font-mono tabular-nums">
                {format(now, "hh:mm:ss a")}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/20"
            >
              ● ONLINE
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status filter removed */}
      </div>

      <div className="px-4 pb-4">
        <DispatchBoard
          trips={filteredTrips}
          allTrips={dispatchTrips}
          drivers={drivers || []}
          vehicles={vehicles || []}
          onSendMessage={(trip) => {
            setTripToMessage(trip);
            setMessageOpen(true);
          }}
          onCompleteTrip={(trip) => {
            setTripToComplete(trip);
            setCompleteTripOpen(true);
          }}
          onUpdateStatus={handleUpdateTripStatus}
          onAssignEscort={(trip) => {
            setTripToAssignEscort(trip);
            setAssignEscortOpen(true);
          }}
          // Invoice generation removed
        />

        <TripMessageDialog
          open={messageOpen}
          tripToMessage={tripToMessage}
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onClose={() => setMessageOpen(false)}
        />

        <CompleteTripDialog
          open={completeTripOpen}
          trip={tripToComplete}
          onClose={() => setCompleteTripOpen(false)}
          onConfirm={handleConfirmCompleteTrip}
        />

        <AssignEscortDialog
          open={assignEscortOpen}
          trip={tripToAssignEscort}
          onClose={() => setAssignEscortOpen(false)}
          onEscortAssigned={handleEscortAssigned}
        />
      </div>
    </div>
  );
}
