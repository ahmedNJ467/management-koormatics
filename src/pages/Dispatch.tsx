import React, { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTripsData } from "@/hooks/use-trips-data";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { DispatchBoard } from "@/components/dispatch/DispatchBoard";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { CompleteTripDialog } from "@/components/dispatch/CompleteTripDialog";
import { AssignVehicleDialog } from "@/components/dispatch/AssignVehicleDialog";
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

export default function Dispatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trips = [], isLoading, drivers = [], vehicles = [] } = useTripsData();

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

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Pass all trips to DispatchBoard - it will handle the filtering internally
  const dispatchTrips = Array.isArray(trips)
    ? trips.filter((trip) => trip && typeof trip === "object")
    : [];

  // Add overdue trip monitoring
  useOverdueTrips(dispatchTrips);

  // Enhanced analytics calculations
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
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["drivers"] });
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
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
  };

  // Handle sending a message to driver
  const handleSendMessage = async () => {
    if (!tripToMessage || !newMessage.trim()) return;

    try {
      logActivity({
        title: `Message sent to driver for trip ${tripToMessage.id}`,
        type: "trip",
        relatedId: tripToMessage.id.toString(),
      });

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
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
  };

  // Handle driver assignment from dispatch
  const handleDriverAssigned = () => {
    if (tripToAssign) {
      logActivity({
        title: `Driver assigned to trip ${tripToAssign.id}`,
        type: "trip",
        relatedId: tripToAssign.id.toString(),
      });
    }

    toast({
      title: "Driver assigned",
      description: "The driver has been successfully assigned to the trip",
    });
  };

  const handleVehicleAssigned = () => {
    // The dialog handles success messages and query invalidation.
  };

  const handleUpdateTripStatus = async (tripId: string, status: TripStatus) => {
    const { error } = await supabase
      .from("trips")
      .update({ status })
      .eq("id", tripId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update trip status.",
        variant: "destructive",
      });
      console.error("Error updating trip status:", error);
    } else {
      toast({
        title: "Success",
        description: `Trip status updated to ${status.replace("_", " ")}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    }
  };

  const handleGenerateInvoice = async (trip: DisplayTrip) => {
    if (trip.invoice_id) {
      toast({
        title: "Invoice Already Exists",
        description: "An invoice has already been generated for this trip.",
      });
      return;
    }

    try {
      await generateInvoiceForTrip(trip);
      toast({
        title: "Invoice Generated",
        description: "Invoice has been successfully generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: `Failed to generate invoice: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleConfirmCompleteTrip = async (
    trip: DisplayTrip,
    logSheet: File
  ) => {
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
    } catch (invoiceError: any) {
      toast({
        title: "Trip Completed, Invoice Failed",
        description: `Trip marked as completed, but invoice generation failed: ${invoiceError.message}`,
        variant: "destructive",
      });
    }

    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setCompleteTripOpen(false);
  };

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
    <div className="space-y-6 animate-fade-in p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Dispatch Center
          </h2>
          <p className="text-muted-foreground">
            Manage trips, assign resources, and monitor fleet operations •{" "}
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Analytics - Compact Inline Display */}
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
    </div>
  );
}
