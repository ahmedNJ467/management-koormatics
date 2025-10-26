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
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { OperationMetrics } from "@/components/dispatch/OperationMetrics";
import { LiveMap } from "@/components/dispatch/LiveMap";
import { InterestPointsManager } from "@/components/dispatch/InterestPointsManager";
// status filter removed from header
import { handleSendMessage as persistTripMessage } from "@/components/trips/operations/message-operations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInterestPoints } from "@/hooks/use-interest-points";
import { AddInterestPointDialog } from "@/components/dispatch/AddInterestPointDialog";

export default function Dispatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trips = [], isLoading, drivers = [], vehicles = [] } = useTripsData();
  const { interestPoints = [] } = useInterestPoints();

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

  // Interest points state
  const [addInterestPointOpen, setAddInterestPointOpen] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pageTab, setPageTab] = useState<
    "overview" | "trips" | "map" | "interest-points"
  >("overview");

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
          .update({ status } as any)
          .eq("id", tripId as any);

        if (error) throw error;

        // Mark that recent updates have occurred for cache clearing
        const { cacheInvalidationManager } = await import(
          "@/lib/cache-invalidation"
        );
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

          // Small delay to ensure data propagation
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force a component re-render
          setRefreshTrigger((prev) => prev + 1);
        } else {
          // For other status changes, use the cache invalidation manager
          await cacheInvalidationManager.invalidateAndRefetch([
            ["trips"],
            ["vehicles"],
            ["drivers"],
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
          .update({ status: "completed", log_sheet_url } as any)
          .eq("id", trip.id as any);

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

  return (
    <div className="relative h-full w-full overflow-hidden m-0 p-0">
      {/* Map fills available space inside page wrapper so sidebar can push it */}
      <div className="absolute inset-0 z-0 m-0 p-0 overflow-hidden">
        <LiveMap
          trips={dispatchTrips}
          interestPoints={interestPoints as any}
          variant="fullscreen"
          onMapClick={(lat, lng) => {
            setClickedCoordinates({ lat, lng });
            setAddInterestPointOpen(true);
          }}
          showInterestPoints={
            pageTab === "map" || pageTab === "interest-points"
          }
        />
      </div>

      {/* Page navbar centered with rectangular tabs and glassy active state */}
      <div
        className="absolute inset-x-0 z-20 flex justify-center pointer-events-none"
        style={{ top: 8 }}
      >
        <div className="pointer-events-auto rounded-md border border-border/40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-1 py-1 shadow-sm">
          <Tabs value={pageTab} onValueChange={(v) => setPageTab(v as any)}>
            <TabsList className="bg-transparent gap-1">
              <TabsTrigger
                value="overview"
                className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-transparent text-muted-foreground hover:bg-foreground/5 data-[state=active]:text-foreground data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur data-[state=active]:border-white/20 data-[state=active]:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] transition-colors"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="trips"
                className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-transparent text-muted-foreground hover:bg-foreground/5 data-[state=active]:text-foreground data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur data-[state=active]:border-white/20 data-[state=active]:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] transition-colors"
              >
                Trips
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-transparent text-muted-foreground hover:bg-foreground/5 data-[state=active]:text-foreground data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur data-[state=active]:border-white/20 data-[state=active]:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.0)] transition-colors"
              >
                Map
              </TabsTrigger>
              <TabsTrigger
                value="interest-points"
                className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-transparent text-muted-foreground hover:bg-foreground/5 data-[state=active]:text-foreground data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur data-[state=active]:border-white/20 data-[state=active]:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] transition-colors"
              >
                Interest Points
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Overlay panel toggled by navbar */}
      {pageTab !== "map" && pageTab !== "interest-points" && (
        <div
          className={`absolute left-4 top-24 z-10 ${
            pageTab === "overview" ? "w-max" : "w-[760px]"
          } max-w-[95vw]`}
        >
          <div
            className={`bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 border border-border/40 rounded-md overflow-hidden ${
              pageTab === "overview" ? "" : "h-[72vh] flex flex-col"
            }`}
          >
            {pageTab === "overview" ? (
              <div className="pt-2 px-3 pb-3 m-0">
                <div className="mb-1">
                  <div className="text-sm md:text-base font-medium text-foreground">
                    {format(now, "EEE, MMM d, yyyy")} •{" "}
                    <span className="font-mono tabular-nums">
                      {format(now, "HH:mm:ss")}
                    </span>
                  </div>
                </div>
                <OperationMetrics
                  trips={dispatchTrips}
                  drivers={drivers || []}
                  vehicles={vehicles || []}
                  variant="strip"
                />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden p-0 m-0">
                <div className="h-full overflow-hidden">
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
                    variant="overlay"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interest Points Panel */}
      {pageTab === "interest-points" && (
        <div className="absolute left-4 top-24 z-10 w-[760px] max-w-[95vw]">
          <div className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 border border-border/40 rounded-md overflow-hidden h-[72vh] flex flex-col">
            <div className="flex-1 overflow-hidden p-0 m-0">
              <div className="h-full overflow-hidden">
                <InterestPointsManager
                  onInterestPointSelected={(point) => {
                    // Center map on selected interest point
                    if ((window as any).google?.maps) {
                      const map = (window as any).google.maps;
                      const center = new map.LatLng(
                        point.latitude,
                        point.longitude
                      );
                      // You would need to access the map instance here to center it
                    }
                  }}
                  onInterestPointUpdated={() => {
                    // Refresh interest points data
                    queryClient.invalidateQueries({
                      queryKey: ["interest-points"],
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
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

      {/* Add Interest Point Dialog */}
      <AddInterestPointDialog
        open={addInterestPointOpen}
        onClose={() => {
          setAddInterestPointOpen(false);
          setClickedCoordinates(null);
        }}
        initialCoordinates={clickedCoordinates || undefined}
        onInterestPointAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["interest-points"] });
        }}
      />
    </div>
  );
}