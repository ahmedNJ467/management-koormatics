import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTripsData } from "@/hooks/use-trips-data";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { CompleteTripDialog } from "@/components/dispatch/CompleteTripDialog";
import { AssignVehicleDialog } from "@/components/dispatch/AssignVehicleDialog";
import { AssignEscortDialog } from "@/components/dispatch/AssignEscortDialog";

import { logActivity } from "@/utils/activity-logger";
import { useOverdueTrips } from "@/hooks/use-overdue-trips";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoiceForTrip } from "@/lib/invoice-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Calendar,
  Users,
  Car,
  MapPin,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  BarChart3,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OperationMetrics } from "@/components/dispatch/OperationMetrics";
import { LiveMap } from "@/components/dispatch/LiveMap";
import { QuickActions } from "@/components/dispatch/QuickActions";
import { OperationCenter } from "@/components/dispatch/OperationCenter";

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
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [completeTripOpen, setCompleteTripOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [tripToComplete, setTripToComplete] = useState<DisplayTrip | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [assignVehicleOpen, setAssignVehicleOpen] = useState(false);
  const [tripToAssignVehicle, setTripToAssignVehicle] =
    useState<DisplayTrip | null>(null);
  const [assignEscortOpen, setAssignEscortOpen] = useState(false);
  const [tripToAssignEscort, setTripToAssignEscort] =
    useState<DisplayTrip | null>(null);

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

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

    const availableDrivers =
      drivers.length -
      dispatchTrips.filter((t) => t.driver_id && t.status === "in_progress")
        .length;

    const availableVehicles =
      vehicles.length -
      dispatchTrips.filter((t) => t.vehicle_id && t.status === "in_progress")
        .length;

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

  // Filtered trips for search and status
  const filteredTrips = useMemo(() => {
    return dispatchTrips.filter((trip) => {
      const matchesSearch =
        !searchTerm ||
        trip.pickup_location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        trip.dropoff_location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || trip.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dispatchTrips, searchTerm, statusFilter]);

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
    if (!tripToMessage || !newMessage.trim()) return;

    try {
      logActivity({
        title: `Message sent to driver for trip ${tripToMessage.id}`,
        type: "communication" as any,
      });

      toast({
        title: "Message Sent",
        description: "Message has been sent to the driver",
      });

      setNewMessage("");
      setMessageOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [tripToMessage, newMessage, toast]);

  const handleDriverAssigned = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    setAssignOpen(false);
    toast({
      title: "Driver Assigned",
      description: "Driver has been successfully assigned to the trip",
    });
  }, [queryClient, toast]);

  const handleVehicleAssigned = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    setAssignVehicleOpen(false);
    toast({
      title: "Vehicle Assigned",
      description: "Vehicle has been successfully assigned to the trip",
    });
  }, [queryClient, toast]);

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

  const handleGenerateInvoice = useCallback(
    async (trip: DisplayTrip) => {
      try {
        await generateInvoiceForTrip(trip);
        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        toast({
          title: "Invoice Generated",
          description: "Invoice has been generated successfully",
        });
      } catch (error: unknown) {
        console.error("Error generating invoice:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast({
          title: "Error",
          description: `Failed to generate invoice: ${errorMessage}`,
          variant: "destructive",
        });
      }
    },
    [queryClient, toast]
  );

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

        try {
          await generateInvoiceForTrip({
            ...trip,
            status: "completed",
            log_sheet_url,
          });
          toast({
            title: "Trip Completed",
            description:
              "Log sheet uploaded, trip marked as completed, and invoice generated.",
          });
        } catch (invoiceError: unknown) {
          const errorMessage =
            invoiceError instanceof Error
              ? invoiceError.message
              : "Unknown error occurred";
          toast({
            title: "Trip Completed, Invoice Failed",
            description: `Trip marked as completed, but invoice generation failed: ${errorMessage}`,
            variant: "destructive",
          });
        }

        await queryClient.invalidateQueries({ queryKey: ["trips"] });
        await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
      <div className="space-y-8 animate-fade-in p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Dispatch Center
            </h2>
            <p className="text-muted-foreground">Loading dispatch data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Header with Operation Room Styling */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Operation Center
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Fleet Command & Control • {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
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
      </div>

      <div className="space-y-6 p-6">
        {/* Operation Metrics Dashboard */}
        <OperationMetrics trips={dispatchTrips} drivers={drivers} vehicles={vehicles} />

        {/* Quick Actions and Search */}
        <QuickActions
          onRefresh={handleRefresh}
          onSearchChange={setSearchTerm}
          onFilterChange={setStatusFilter}
          refreshing={refreshing}
          searchTerm={searchTerm}
          currentFilter={statusFilter}
        />

        {/* Live Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <LiveMap trips={dispatchTrips} />
          </div>
          <div>
            <OperationCenter trips={dispatchTrips} onRefresh={handleRefresh} />
          </div>
        </div>

        {/* Legacy Analytics - Compact Inline Display */}
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-4">
        {/* Today's Trips */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Today:
          </span>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {analytics.todayTrips}
          </span>
        </div>

        {/* In Progress */}
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Active:
          </span>
          <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
            {analytics.inProgressCount}
          </span>
        </div>

        {/* Completed */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Done:
          </span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            {analytics.completedCount}
          </span>
        </div>

        {/* Overdue */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Overdue:
          </span>
          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
            {analytics.overdueCount}
          </span>
        </div>

        {/* Available Drivers */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Drivers:
          </span>
          <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {analytics.availableDrivers}
          </span>
        </div>

        {/* Available Vehicles */}
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Vehicles:
          </span>
          <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
            {analytics.availableVehicles}
          </span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by location, client, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Section */}
      {(analytics.overdueCount > 0 ||
        analytics.unassignedDrivers > 0 ||
        analytics.unassignedVehicles > 0) && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Dispatch Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.overdueCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{analytics.overdueCount}</Badge>
                <span className="text-sm">
                  overdue trips require immediate attention
                </span>
              </div>
            )}
            {analytics.unassignedDrivers > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{analytics.unassignedDrivers}</Badge>
                <span className="text-sm">trips need driver assignment</span>
              </div>
            )}
            {analytics.unassignedVehicles > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {analytics.unassignedVehicles}
                </Badge>
                <span className="text-sm">trips need vehicle assignment</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Dispatch Board */}
      <DispatchBoard
        trips={filteredTrips}
        drivers={drivers || []}
        vehicles={vehicles || []}
        onAssignDriver={(trip) => {
          setTripToAssign(trip);
          setAssignOpen(true);
        }}
        onSendMessage={(trip) => {
          setTripToMessage(trip);
          setMessageOpen(true);
        }}
        onCompleteTrip={(trip) => {
          setTripToComplete(trip);
          setCompleteTripOpen(true);
        }}
        onUpdateStatus={handleUpdateTripStatus}
        onAssignVehicle={(trip) => {
          setTripToAssignVehicle(trip);
          setAssignVehicleOpen(true);
        }}
        onAssignEscort={(trip) => {
          setTripToAssignEscort(trip);
          setAssignEscortOpen(true);
        }}
        onGenerateInvoice={handleGenerateInvoice}
      />

      {/* Dialogs */}
      <AssignDriverDialog
        open={assignOpen}
        tripToAssign={tripToAssign}
        onClose={() => setAssignOpen(false)}
        onDriverAssigned={handleDriverAssigned}
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

      <AssignVehicleDialog
        open={assignVehicleOpen}
        trip={tripToAssignVehicle}
        onClose={() => setAssignVehicleOpen(false)}
        onVehicleAssigned={handleVehicleAssigned}
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
