
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Car,
  MoreHorizontal,
  CalendarDays,
  Clock,
  Calendar,
  User,
  Users,
  MapPin,
  Edit,
  Trash,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  DollarSign,
} from "lucide-react";
import TripForm from "@/components/trips/trip-form";
import { Trip, DisplayTrip, TripType, TripStatus } from "@/lib/types";

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [tripToEdit, setTripToEdit] = useState<DisplayTrip | null>(null);
  const [createTripOpen, setCreateTripOpen] = useState(false);
  const [viewTripOpen, setViewTripOpen] = useState(false);
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch trips data with client, vehicle and driver details
  const {
    data: trips,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(id, name, type),
          vehicles:vehicle_id(id, make, model, registration, type),
          drivers:driver_id(id, name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching trips:", error);
        throw new Error("Failed to fetch trips");
      }

      // Transform raw data into DisplayTrip format
      const formattedTrips: DisplayTrip[] = data.map((trip) => ({
        ...trip,
        client_name: trip.clients?.name || "Unknown",
        client_type: trip.clients?.type,
        vehicle_details: trip.vehicles
          ? `${trip.vehicles.make} ${trip.vehicles.model} (${trip.vehicles.registration})`
          : "Unknown",
        driver_name: trip.drivers?.name || "Unknown",
        driver_avatar: trip.drivers?.avatar_url,
        driver_contact: trip.drivers?.contact,
      }));

      return formattedTrips;
    },
  });

  // Create trip function
  const createTrip = async (tripData: any) => {
    try {
      // Format date for database
      const formattedDate = format(tripData.date, "yyyy-MM-dd");

      // Prepare trip data for Supabase
      const newTripData = {
        client_id: tripData.client_id,
        vehicle_id: tripData.vehicle_id,
        driver_id: tripData.driver_id,
        date: formattedDate,
        start_time: tripData.start_time || null,
        end_time: tripData.end_time || null,
        type: tripData.type as TripType,
        status: tripData.status as TripStatus,
        pickup_location: tripData.pickup_location || null,
        dropoff_location: tripData.dropoff_location || null,
        notes: tripData.notes || null,
        amount: tripData.amount || 0,
      };

      const { data, error } = await supabase
        .from("trips")
        .insert(newTripData)
        .select();

      if (error) throw error;

      toast({
        title: "Trip created",
        description: "The trip has been successfully created",
      });

      setCreateTripOpen(false);
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive",
      });
    }
  };

  // Update trip function
  const updateTrip = async (tripData: any) => {
    if (!tripToEdit) return;

    try {
      // Format date for database
      const formattedDate = format(tripData.date, "yyyy-MM-dd");

      // Prepare trip data for Supabase
      const updateData = {
        client_id: tripData.client_id,
        vehicle_id: tripData.vehicle_id,
        driver_id: tripData.driver_id,
        date: formattedDate,
        start_time: tripData.start_time || null,
        end_time: tripData.end_time || null,
        type: tripData.type as TripType,
        status: tripData.status as TripStatus,
        pickup_location: tripData.pickup_location || null,
        dropoff_location: tripData.dropoff_location || null,
        notes: tripData.notes || null,
        amount: tripData.amount || 0,
      };

      const { data, error } = await supabase
        .from("trips")
        .update(updateData)
        .eq("id", tripToEdit.id)
        .select();

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: "The trip has been successfully updated",
      });

      setTripToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error updating trip:", error);
      toast({
        title: "Error",
        description: "Failed to update trip",
        variant: "destructive",
      });
    }
  };

  // Delete trip function
  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase.from("trips").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Trip deleted",
        description: "The trip has been successfully deleted",
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Update trip status
  const updateTripStatus = async (id: string, status: TripStatus) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Trip status changed to ${status.replace('_', ' ')}`,
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    }
  };

  // View trip details
  const handleViewTrip = (trip: DisplayTrip) => {
    setViewTrip(trip);
    setViewTripOpen(true);
  };

  // Edit trip
  const handleEditTrip = (trip: DisplayTrip) => {
    setTripToEdit(trip);
  };

  // Filter and search trips
  const filteredTrips = trips?.filter((trip) => {
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      trip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle_details.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== "all") {
      setStatusFilter(value as TripStatus);
    } else {
      setStatusFilter("all");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid date";
    }
  };

  // Format trip type for display
  const formatTripType = (type: TripType) => {
    switch (type) {
      case "airport_pickup":
        return "Airport Pickup";
      case "airport_dropoff":
        return "Airport Dropoff";
      case "hourly":
        return "Hourly Service";
      case "full_day":
        return "Full Day";
      case "multi_day":
        return "Multi-Day";
      case "other":
        return "Other";
      default:
        return String(type).replace(/_/g, " ");
    }
  };

  // Get badge color based on status
  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // When there's an error fetching trips
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2" /> Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load trips data. Please try again later.</p>
            <Button
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["trips"] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
          <p className="text-muted-foreground">
            Manage all your trips and schedules
          </p>
        </div>
        <Button onClick={() => setCreateTripOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Trip
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trips..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All Trips</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="rounded-md border p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Loading trips...</p>
            </div>
          ) : filteredTrips && filteredTrips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Trip Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">
                      {formatDate(trip.date)}
                    </TableCell>
                    <TableCell>{trip.client_name}</TableCell>
                    <TableCell>{formatTripType(trip.type)}</TableCell>
                    <TableCell>{trip.vehicle_details}</TableCell>
                    <TableCell>{trip.driver_name}</TableCell>
                    <TableCell>${Number(trip.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(trip.status)}
                      >
                        {String(trip.status).replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewTrip(trip)}>
                            <FileText className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTrip(trip)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Trip
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          {trip.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() => updateTripStatus(trip.id, "in_progress")}
                            >
                              <Clock className="mr-2 h-4 w-4" /> Mark as In Progress
                            </DropdownMenuItem>
                          )}
                          
                          {(trip.status === "scheduled" || trip.status === "in_progress") && (
                            <DropdownMenuItem
                              onClick={() => updateTripStatus(trip.id, "completed")}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                            </DropdownMenuItem>
                          )}
                          
                          {trip.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => updateTripStatus(trip.id, "cancelled")}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" /> Cancel Trip
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this trip?")) {
                                deleteTrip(trip.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No trips found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No trips match your search criteria."
                  : "Get started by creating a new trip."}
              </p>
              <Button
                className="mt-4"
                onClick={() => setCreateTripOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Trip
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Trip Dialog */}
      <Dialog
        open={createTripOpen || !!tripToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setCreateTripOpen(false);
            setTripToEdit(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {tripToEdit ? "Edit Trip" : "Create New Trip"}
            </DialogTitle>
            <DialogDescription>
              {tripToEdit
                ? "Edit the trip details below"
                : "Fill in the details to create a new trip"}
            </DialogDescription>
          </DialogHeader>
          <TripForm
            initialData={tripToEdit || undefined}
            onSubmit={tripToEdit ? updateTrip : createTrip}
            onCancel={() => {
              setCreateTripOpen(false);
              setTripToEdit(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Trip Dialog */}
      <Dialog
        open={viewTripOpen}
        onOpenChange={(open) => {
          setViewTripOpen(open);
          if (!open) setViewTrip(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          {viewTrip && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-semibold">{formatTripType(viewTrip.type)}</h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {viewTrip.id.substring(0, 8)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(viewTrip.status)}
                >
                  {String(viewTrip.status).replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <Calendar className="mr-1 h-4 w-4" /> Date
                  </p>
                  <p>{formatDate(viewTrip.date)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <Clock className="mr-1 h-4 w-4" /> Time
                  </p>
                  <p>
                    {viewTrip.start_time
                      ? viewTrip.end_time
                        ? `${viewTrip.start_time} - ${viewTrip.end_time}`
                        : viewTrip.start_time
                      : "Not specified"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <Users className="mr-1 h-4 w-4" /> Client
                  </p>
                  <p>{viewTrip.client_name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <Car className="mr-1 h-4 w-4" /> Vehicle
                  </p>
                  <p>{viewTrip.vehicle_details}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <User className="mr-1 h-4 w-4" /> Driver
                  </p>
                  <p>{viewTrip.driver_name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center">
                    <DollarSign className="mr-1 h-4 w-4" /> Amount
                  </p>
                  <p>${Number(viewTrip.amount).toFixed(2)}</p>
                </div>
              </div>

              {(viewTrip.pickup_location || viewTrip.dropoff_location) && (
                <div className="space-y-2 border-t pt-2">
                  {viewTrip.pickup_location && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center">
                        <MapPin className="mr-1 h-4 w-4" /> Pickup Location
                      </p>
                      <p className="text-sm">{viewTrip.pickup_location}</p>
                    </div>
                  )}

                  {viewTrip.dropoff_location && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center">
                        <ArrowRight className="mr-1 h-4 w-4" /> Dropoff Location
                      </p>
                      <p className="text-sm">{viewTrip.dropoff_location}</p>
                    </div>
                  )}
                </div>
              )}

              {viewTrip.notes && (
                <div className="border-t pt-2">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm whitespace-pre-line">{viewTrip.notes}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewTripOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
