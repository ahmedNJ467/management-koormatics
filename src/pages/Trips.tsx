import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Car,
  User,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  FileText,
  Send,
  Clock,
  Repeat,
  Check,
  X,
  Trash,
  Plane,
  ArrowRight,
  Shield,
  Calendar,
} from "lucide-react";
import {
  TripStatus,
  TripType,
  Trip,
  DisplayTrip,
  Driver,
  Vehicle,
  Client,
} from "@/lib/types";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

// Define custom service types for UI display
type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

// Map UI service types to database TripType values
const serviceTypeMap: Record<UIServiceType, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "round_trip",
  "security_escort": "security_escort",
  "one_way": "one_way_transfer",
  "full_day_hire": "full_day"
};

// Helper function to get the first day of the month
const getFirstDayOfMonth = (date: Date) => startOfMonth(date);

// Helper function to get the last day of the month
const getLastDayOfMonth = (date: Date) => endOfMonth(date);

// Helper function to generate an array of dates within a specified range
const getDaysInInterval = (start: Date, end: Date) => {
  return eachDayOfInterval({ start, end });
};

const Trips = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DisplayTrip | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [tripMessages, setTripMessages] = useState<TripMessageData[]>([]);
  const [tripAssignments, setTripAssignments] = useState<TripAssignmentData[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState<string>("");
  const [isDriverAcceptanceDialogOpen, setIsDriverAcceptanceDialogOpen] = useState(false);
  const [driverResponse, setDriverResponse] = useState<'accepted' | 'rejected' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<TripAssignment | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedTripType, setSelectedTripType] = useState<TripType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TripStatus | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch trips data
  const { data: trips, isLoading, isError } = useQuery<DisplayTrip[]>({
    queryKey: ["trips", selectedDate, searchQuery, selectedTripType, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select(
          `
          id, client_id, vehicle_id, driver_id, date, start_time, end_time, type, status, amount, pickup_location, dropoff_location, notes, invoice_id, created_at, updated_at,
          clients ( name, type ),
          vehicles ( make, model ),
          drivers ( name, avatar, contact )
        `
        )
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (selectedDate) {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        query = query.eq("date", formattedDate);
      }

      if (searchQuery) {
        query = query.ilike("pickup_location", `%${searchQuery}%`);
      }

      if (selectedTripType) {
        query = query.eq("type", selectedTripType);
      }

      if (selectedStatus) {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching trips:", error);
        throw new Error(error.message);
      }

      return data.map((trip) => {
        const typedTrip = trip as any; // tell typescript to chill
        return {
          ...typedTrip,
          client_name: typedTrip.clients?.name || "N/A",
          client_type: typedTrip.clients?.type || "individual",
          vehicle_details: `${typedTrip.vehicles?.make || "N/A"} ${typedTrip.vehicles?.model || "N/A"}`,
          driver_name: typedTrip.drivers?.name || "N/A",
          driver_avatar: typedTrip.drivers?.avatar || "",
          driver_contact: typedTrip.drivers?.contact || "",
          time: typedTrip.start_time ? format(new Date(`1970-01-01T${typedTrip.start_time}`), "h:mm a") : "N/A",
          return_time: typedTrip.end_time ? format(new Date(`1970-01-01T${typedTrip.end_time}`), "h:mm a") : "N/A",
          ui_service_type: (Object.keys(serviceTypeMap) as (keyof typeof serviceTypeMap)[]).find(key => serviceTypeMap[key] === typedTrip.type) || 'other',
        };
      });
    },
  });

  // Fetch drivers data
  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").order("name");

      if (error) {
        console.error("Error fetching drivers:", error);
        throw new Error(error.message);
      }

      return data;
    },
  });

  // Fetch vehicles data
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("make");

      if (error) {
        console.error("Error fetching vehicles:", error);
        throw new Error(error.message);
      }

      return data;
    },
  });

  // Fetch clients data
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");

      if (error) {
        console.error("Error fetching clients:", error);
        throw new Error(error.message);
      }

      return data;
    },
  });

  // Handlers for dialogs
  const openCreateDialog = () => setIsCreateDialogOpen(true);
  const closeCreateDialog = () => setIsCreateDialogOpen(false);
  const openEditDialog = (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setIsEditDialogOpen(true);
  };
  const closeEditDialog = () => setIsEditDialogOpen(false);
  const openDeleteDialog = (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setIsDeleteDialogOpen(true);
  };
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);

  // Handler to open the message dialog
  const openMessageDialog = async (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setIsMessageDialogOpen(true);

    // Fetch trip messages when the dialog is opened
    const { data, error } = await supabase
      .from("trip_messages")
      .select("*")
      .eq("trip_id", trip.id)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error fetching trip messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trip messages.",
        variant: "destructive",
      });
    } else {
      // Mark messages as read when opening the dialog
      const unreadMessages = data.filter((message) => !message.is_read);
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((message) => message.id);
        const { error: updateError } = await supabase
          .from("trip_messages")
          .update({ is_read: true })
          .in("id", messageIds);

        if (updateError) {
          console.error("Error marking messages as read:", updateError);
          toast({
            title: "Error",
            description: "Failed to mark messages as read.",
            variant: "destructive",
          });
        } else {
          // Optimistically update the local state
          setTripMessages(
            data.map((message) => ({
              ...message,
              is_read: true,
            }))
          );
        }
      } else {
        setTripMessages(data);
      }
    }
  };
  const closeMessageDialog = () => setIsMessageDialogOpen(false);

  // Handler to send a new message
  const handleSendMessage = async (message: string) => {
    if (!selectedTrip) {
      toast({
        title: "Error",
        description: "No trip selected.",
        variant: "destructive",
      });
      return;
    }

    const newMessage = {
      trip_id: selectedTrip.id,
      sender_type: "admin",
      sender_name: "Admin", // Replace with actual admin name if available
      message: message,
      timestamp: new Date().toISOString(),
      is_read: false,
    };

    const { data, error } = await supabase.from("trip_messages").insert([newMessage]).select().single();

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } else {
      // Optimistically update the local state
      setTripMessages((prevMessages) => [...prevMessages, data as TripMessageData]);
    }
  };

  // Handler to open the assignment dialog
  const openAssignmentDialog = async (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setIsAssignmentDialogOpen(true);

    // Fetch trip assignments when the dialog is opened
    const { data, error } = await supabase
      .from("trip_assignments")
      .select("*")
      .eq("trip_id", trip.id)
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Error fetching trip assignments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trip assignments.",
        variant: "destructive",
      });
    } else {
      setTripAssignments(data as TripAssignmentData[]);
    }
  };
  const closeAssignmentDialog = () => setIsAssignmentDialogOpen(false);

  // Handler to assign a driver to the trip
  const handleAssignDriver = async () => {
    if (!selectedTrip || !selectedDriverId) {
      toast({
        title: "Error",
        description: "Please select a trip and a driver.",
        variant: "destructive",
      });
      return;
    }

    const selectedDriver = drivers?.find((driver) => driver.id === selectedDriverId);

    if (!selectedDriver) {
      toast({
        title: "Error",
        description: "Selected driver not found.",
        variant: "destructive",
      });
      return;
    }

    const newAssignment = {
      trip_id: selectedTrip.id,
      driver_id: selectedDriverId,
      driver_name: selectedDriver.name,
      driver_avatar: selectedDriver.avatar,
      assigned_at: new Date().toISOString(),
      status: "pending",
      notes: assignmentNotes,
    };

    const { data, error } = await supabase.from("trip_assignments").insert([newAssignment]).select().single();

    if (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver.",
        variant: "destructive",
      });
    } else {
      // Optimistically update the local state
      setTripAssignments((prevAssignments) => [...prevAssignments, data as TripAssignmentData]);
      toast({
        title: "Success",
        description: "Driver assigned successfully.",
      });
      setAssignmentNotes("");
    }
  };

  // Handler to open the driver acceptance dialog
  const openDriverAcceptanceDialog = (assignment: TripAssignment) => {
    setSelectedAssignment(assignment);
    setIsDriverAcceptanceDialogOpen(true);
  };
  const closeDriverAcceptanceDialog = () => {
    setIsDriverAcceptanceDialogOpen(false);
    setDriverResponse(null);
  };

  // Handler for driver acceptance/rejection
  const handleDriverResponse = async (response: 'accepted' | 'rejected') => {
    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "No assignment selected.",
        variant: "destructive",
      });
      return;
    }

    setDriverResponse(response);

    const { error } = await supabase
      .from("trip_assignments")
      .update({ status: response })
      .eq("id", selectedAssignment.id);

    if (error) {
      console.error("Error updating assignment status:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive",
      });
    } else {
      // Optimistically update the local state
      setTripAssignments((prevAssignments) =>
        prevAssignments.map((assignment) =>
          assignment.id === selectedAssignment.id ? { ...assignment, status: response } : assignment
        )
      );
      toast({
        title: "Success",
        description: `Assignment ${response} successfully.`,
      });
    }
    closeDriverAcceptanceDialog();
  };

  // Handler to remove a trip assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from("trip_assignments").delete().eq("id", assignmentId);

    if (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Error",
        description: "Failed to remove assignment.",
        variant: "destructive",
      });
    } else {
      // Optimistically update the local state
      setTripAssignments((prevAssignments) => prevAssignments.filter((assignment) => assignment.id !== assignmentId));
      toast({
        title: "Success",
        description: "Assignment removed successfully.",
      });
    }
  };

  // Handler for date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handler for search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handler for creating a new trip
  const handleCreateTrip = async (tripData: Omit<Trip, "id">) => {
    const { data, error } = await supabase.from("trips").insert([tripData]).select().single();

    if (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip.",
        variant: "destructive",
      });
    } else {
      // Invalidate the cache to refetch trips data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Success",
        description: "Trip created successfully.",
      });
      closeCreateDialog();
    }
  };

  // Handler for editing an existing trip
  const handleEditTrip = async (tripData: Trip) => {
    const { data, error } = await supabase.from("trips").update(tripData).eq("id", tripData.id).select().single();

    if (error) {
      console.error("Error editing trip:", error);
      toast({
        title: "Error",
        description: "Failed to edit trip.",
        variant: "destructive",
      });
    } else {
      // Invalidate the cache to refetch trips data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Success",
        description: "Trip updated successfully.",
      });
      closeEditDialog();
    }
  };

  // Handler for deleting a trip
  const handleDeleteTrip = async () => {
    if (!selectedTrip) {
      toast({
        title: "Error",
        description: "No trip selected.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("trips").delete().eq("id", selectedTrip.id);

    if (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip.",
        variant: "destructive",
      });
    } else {
      // Invalidate the cache to refetch trips data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Success",
        description: "Trip deleted successfully.",
      });
      closeDeleteDialog();
    }
  };

  // Calendar navigation handlers
  const goToPreviousMonth = () => {
    setCalendarDate(addDays(calendarDate, -30));
  };

  const goToNextMonth = () => {
    setCalendarDate(addDays(calendarDate, 30));
  };

  // Generate days for the calendar
  const daysInMonth = getDaysInInterval(
    getFirstDayOfMonth(calendarDate),
    getLastDayOfMonth(calendarDate)
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Trips</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {isFiltersOpen && (
        <Card className="mb-4">
          <CardContent className="grid gap-4 grid-cols-3">
            <div>
              <Label htmlFor="trip-type">Trip Type</Label>
              <Select onValueChange={(value) => setSelectedTripType(value as TripType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                  <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                  <SelectItem value="one_way_transfer">One Way Transfer</SelectItem>
                  <SelectItem value="round_trip">Round Trip</SelectItem>
                  <SelectItem value="full_day">Full Day Hire</SelectItem>
                  <SelectItem value="security_escort">Security Escort</SelectItem>
                  <SelectItem value="hourly">Hourly Service</SelectItem>
                  <SelectItem value="multi_day">Multi Day</SelectItem>
                  <SelectItem value="other">Other Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trip-status">Trip Status</Label>
              <Select onValueChange={(value) => setSelectedStatus(value as TripStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view trips.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                Previous
              </Button>
              <h2>{format(calendarDate, "MMMM yyyy")}</h2>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                Next
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-muted-foreground">
                  {day}
                </div>
              ))}
              {daysInMonth.map((day) => (
                <Button
                  key={day.toISOString()}
                  variant="outline"
                  className={`
                    w-full h-8 p-0 rounded-md
                    ${isSameDay(day, selectedDate) ? "bg-accent text-accent-foreground" : ""}
                  `}
                  onClick={() => handleDateSelect(day)}
                >
                  {format(day, "d")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search Trips</CardTitle>
            <CardDescription>Search for trips by pickup location.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pickup location..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trips for {format(selectedDate, "MMM dd, yyyy")}</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading trips..."
              : isError
                ? "Error loading trips."
                : trips?.length === 0
                  ? "No trips found for this date."
                  : `Showing ${trips?.length} trips.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[800px]" ref={tableRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips?.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.client_name}</TableCell>
                      <TableCell>{trip.vehicle_details}</TableCell>
                      <TableCell>{trip.driver_name}</TableCell>
                      <TableCell>{trip.time}</TableCell>
                      <TableCell>{trip.type}</TableCell>
                      <TableCell>{trip.status}</TableCell>
                      <TableCell className="text-right">${Number(trip.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(trip)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMessageDialog(trip)}>Messages</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAssignmentDialog(trip)}>Assignments</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(trip)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Trip Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>Make a new entry for a trip.</DialogDescription>
          </DialogHeader>
          <CreateTripForm
            clients={clients}
            vehicles={vehicles}
            drivers={drivers}
            onCreate={handleCreateTrip}
            onClose={closeCreateDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>Edit an existing trip.</DialogDescription>
          </DialogHeader>
          <EditTripForm
            trip={selectedTrip}
            clients={clients}
            vehicles={vehicles}
            drivers={drivers}
            onEdit={handleEditTrip}
            onClose={closeEditDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this trip?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Trip Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Trip Messages</DialogTitle>
            <DialogDescription>Send and view messages related to this trip.</DialogDescription>
          </DialogHeader>
          <TripMessages
            trip={selectedTrip}
            messages={tripMessages}
            onSendMessage={handleSendMessage}
            onClose={closeMessageDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Assignment Trip Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Trip Assignments</DialogTitle>
            <DialogDescription>Assign drivers to this trip and view assignments.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
              <TabsTrigger value="history">Assignment History</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="driver">Driver</Label>
                  <Select onValueChange={(value) => setSelectedDriverId(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes for the driver"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleAssignDriver}>Assign Driver</Button>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <ScrollArea className="w-full h-[300px] mt-4">
                {tripAssignments.length === 0 ? (
                  <Alert>
                    <AlertTitle>No Assignments</AlertTitle>
                    <AlertDescription>No drivers have been assigned to this trip yet.</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Assigned At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tripAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name} />
                                <AvatarFallback>{assignment.driver_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{assignment.driver_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(assignment.assigned_at), "MMM dd, yyyy h:mm a")}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                assignment.status === "accepted"
                                  ? "success"
                                  : assignment.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {assignment.status === "pending" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openDriverAcceptanceDialog(assignment)}>
                                    Respond
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleRemoveAssignment(assignment.id)}>
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
