
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  CalendarIcon,
  Copy,
  Edit,
  FileText,
  Filter,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DisplayTrip, Trip, TripStatus, TripType } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

// Function to determine the appropriate icon based on trip type
const getTripTypeIcon = (tripType: string) => {
  switch (tripType) {
    case "airport_transfer":
      return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-plane h-3 w-3"
      >
        <path d="M17.9 17.9 3 12l14.9-5.9L21 6v6l-3.1 5.9z" />
        <path d="m21 14-5.3 5.3L22 22z" />
      </svg>;
    case "hourly":
      return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-timer h-3 w-3"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>;
    case "long_distance":
      return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-route h-3 w-3"
      >
        <circle cx="5" cy="5" r="2" />
        <path d="M19 12v6" />
        <circle cx="5" cy="19" r="2" />
        <line x1="5" x2="19" y1="7" y2="12" />
        <path d="M12 5v14" />
        <circle cx="19" cy="12" r="2" />
      </svg>;
    default:
      return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-car h-3 w-3"
      >
        <rect width="18" height="12" x="3" y="5" rx="2" />
        <circle cx="6" cy="17" r="2" />
        <circle cx="18" cy="17" r="2" />
      </svg>;
  }
};

// Function to format trip type
const formatTripType = (tripType: string, trip: Trip) => {
  switch (tripType) {
    case "airport_transfer":
      return "Airport Transfer";
    case "hourly":
      return `Hourly (${trip.hours} hrs)`;
    case "long_distance":
      return "Long Distance";
    default:
      return "Standard";
  }
};

// Function to format the trip ID
const formatTripId = (id: string) => {
  return `TRIP-${id.slice(-4).toUpperCase()}`;
};

// Function to format the date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, "MMM dd, yyyy");
};

// Function to format the time
const formatTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return format(date, "h:mm a");
};

// Function to determine status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100";
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
  }
};

// Function to format status
const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
};

// Function to parse passengers from notes
const parsePassengers = (notes?: string) => {
  if (!notes) return [];
  
  const passengersMatch = notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1].split('\n').filter(p => p.trim());
  }
  
  return [];
};

export default function Trips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? new Date(dateParam) : undefined;
  });
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [calendarView, setCalendarView] = useState(false);
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);

  // Fetch trips data
  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips", date?.toISOString(), statusFilter, searchQuery],
    queryFn: async () => {
      // Filter params
      let query = supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, type),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (date) {
        query = query.eq("date", date.toISOString().split('T')[0]);
      }
      
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((trip: any) => ({
        ...trip,
        client_name: trip.clients?.name || "Unknown Client",
        client_type: trip.clients?.type || "individual",
        vehicle_details: `${trip.vehicles?.make} ${trip.vehicles?.model} (${trip.vehicles?.registration})`,
        driver_name: trip.drivers?.name || "Unknown Driver",
        driver_avatar: trip.drivers?.avatar_url,
        driver_contact: trip.drivers?.contact,
        // Map database fields to UI fields
        time: trip.start_time,
        return_time: trip.end_time,
        special_notes: trip.notes,
      })) as DisplayTrip[];
    },
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId);
      
      if (error) throw new Error(error.message);
      return tripId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trip.",
        variant: "destructive",
      });
    },
  });

  // Filter trips based on search query
  const filteredTrips = trips?.filter((trip) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      trip.client_name.toLowerCase().includes(searchTerm) ||
      trip.driver_name?.toLowerCase().includes(searchTerm) ||
      trip.pickup_location?.toLowerCase().includes(searchTerm) ||
      trip.dropoff_location?.toLowerCase().includes(searchTerm) ||
      formatTripId(trip.id).toLowerCase().includes(searchTerm)
    );
  });

  // Add new passenger field
  const addPassengerField = () => {
    setPassengers([...passengers, ""]);
  };

  // Update passenger at specific index
  const updatePassenger = (index: number, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = value;
    setPassengers(updatedPassengers);
  };

  // Remove passenger field
  const removePassengerField = (index: number) => {
    if (passengers.length <= 1) return; // Keep at least one field
    const updatedPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(updatedPassengers);
  };

  // Handle client selection to show passenger fields if organization
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    
    if (!clientId) {
      setSelectedClientType("");
      setPassengers([""]);
      return;
    }
    
    // Find the selected client and check its type
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient) {
      setSelectedClientType(selectedClient.type || "individual");
      // Reset passengers when client changes
      setPassengers([""]);
    }
  };

  // Fetch clients, vehicles, and drivers for forms
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, type")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .eq("status", "active")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, avatar_url, contact")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Add passenger names to notes if client is organization
    let notes = formData.get("special_notes") as string || "";
    if (selectedClientType === "organization" && passengers.filter(p => p.trim()).length > 0) {
      const passengersList = passengers.filter(p => p.trim());
      if (passengersList.length > 0) {
        notes += `\n\nPassengers:\n${passengersList.join('\n')}`;
      }
    }
    
    try {
      if (editTrip) {
        // Update existing trip
        const { error } = await supabase
          .from("trips")
          .update({
            client_id: formData.get("client_id") as string,
            vehicle_id: formData.get("vehicle_id") as string,
            driver_id: formData.get("driver_id") as string,
            date: formData.get("date") as string,
            start_time: formData.get("time") as string,
            end_time: formData.get("return_time") as string || null,
            type: formData.get("service_type") as TripType,
            status: formData.get("status") as TripStatus,
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            notes: notes || null,
          })
          .eq("id", editTrip.id);
        
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else {
        // Create new single trip
        const { error } = await supabase
          .from("trips")
          .insert({
            client_id: formData.get("client_id") as string,
            vehicle_id: formData.get("vehicle_id") as string,
            driver_id: formData.get("driver_id") as string,
            date: formData.get("date") as string,
            start_time: formData.get("time") as string,
            end_time: formData.get("return_time") as string || null,
            type: formData.get("service_type") as TripType,
            status: "scheduled" as TripStatus,
            amount: 0, // Default amount
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            notes: notes || null,
          });
        
        if (error) {
          console.error("Error creating trip:", error);
          throw error;
        }

        toast({
          title: "Trip created",
          description: "New trip has been booked successfully",
        });
        
        setBookingOpen(false);
        // Reset passengers after booking
        setPassengers([""]);
      }
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: "Failed to save trip details",
        variant: "destructive",
      });
    }
  };

  // Update trip status
  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status changed to ${formatStatus(status)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      
      // Update local viewTrip state if it's the current trip
      if (viewTrip && viewTrip.id === tripId) {
        setViewTrip({...viewTrip, status});
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    }
  };

  // Handle trip deletion
  const handleDeleteTrip = () => {
    if (!tripToDelete) return;
    
    deleteTripMutation.mutate(tripToDelete);
    setDeleteDialogOpen(false);
    setTripToDelete(null);
    
    // Close any open dialogs if they were showing the deleted trip
    if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
    if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
            <p className="text-muted-foreground">Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
          <p className="text-muted-foreground">Manage trip reservations and driver assignments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCalendarView(!calendarView)}
          >
            {calendarView ? "List View" : "Calendar View"}
          </Button>
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Book Trip
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded="false">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Status
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
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
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) =>
                date > new Date() || date < new Date("2023-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {calendarView ? (
        <Card>
          <CardHeader>
            <CardTitle>Trip Calendar</CardTitle>
            <CardDescription>View trips in a calendar format.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <p>Calendar view will be implemented here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow dark:shadow-gray-800">
          <Table>
            <TableHeader className="dark:bg-dark-secondary">
              <TableRow className="dark:border-gray-700">
                <TableHead>Trip ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips?.length === 0 ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={8} className="text-center py-8">
                    No trips found. Try adjusting your search or create a new trip.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips?.map((trip) => {
                  // Extract passengers from notes
                  const tripPassengers = parsePassengers(trip.notes);
                  
                  return (
                    <TableRow key={trip.id} className="group dark:border-gray-700 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium">
                        {formatTripId(trip.id)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatDate(trip.date)}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(trip.time)}</div>
                        {trip.return_time && (
                          <div className="text-xs text-muted-foreground">Return: {formatTime(trip.return_time)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{trip.client_name}</div>
                        {trip.client_type === "organization" && (
                          <>
                            <Badge variant="outline" className="text-xs">Organization</Badge>
                            {tripPassengers.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {tripPassengers.length === 1 ? (
                                  <span>Passenger: {tripPassengers[0]}</span>
                                ) : (
                                  <span>Passengers: {tripPassengers.length}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTripTypeIcon(trip.type)}
                          {formatTripType(trip.type, trip)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {trip.pickup_location && (
                          <div className="flex items-start gap-1 truncate">
                            <MapPin className="h-3 w-3 mt-1 shrink-0" />
                            <span className="truncate">{trip.pickup_location}</span>
                          </div>
                        )}
                        {trip.dropoff_location && (
                          <div className="flex items-start gap-1 truncate">
                            <ArrowRight className="h-3 w-3 mt-1 shrink-0" />
                            <span className="truncate">{trip.dropoff_location}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {trip.driver_avatar ? (
                              <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary dark:bg-gray-700 dark:text-gray-300">
                                {trip.driver_name?.charAt(0) || 'D'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{trip.driver_name}</div>
                            {trip.driver_contact && (
                              <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {trip.driver_contact}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(trip.status)}>
                          {formatStatus(trip.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewTrip(trip)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(trip.id);
                                  toast({
                                    title: "Copied",
                                    description: "Trip ID copied to clipboard.",
                                  });
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Trip ID
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setTripToDelete(trip.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-500 focus:bg-red-500/10 hover:bg-red-500/10"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Trip Form Dialog (Edit & Create) */}
      <Dialog open={!!editTrip || bookingOpen} onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false), setPassengers([""]))}> 
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
            <DialogDescription>
              {editTrip 
                ? `Edit trip details for ${editTrip.client_name}`
                : "Create a new trip reservation"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
            <form onSubmit={handleSaveTrip} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select 
                    name="client_id" 
                    defaultValue={editTrip?.client_id} 
                    onValueChange={handleClientChange}
                    required
                  >
                    <SelectTrigger id="client_id">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.type === "organization" && "🏢"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select 
                    name="service_type" 
                    defaultValue={editTrip?.type}
                    required
                  >
                    <SelectTrigger id="service_type">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                      <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                      <SelectItem value="other">Standard Transfer</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="full_day">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Passengers Section - Only show for organization clients */}
              {selectedClientType === "organization" && (
                <div className="border p-4 rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Passengers</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addPassengerField}
                      className="h-8 px-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Passenger
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={`Passenger ${index + 1} name`}
                          value={passenger}
                          onChange={(e) => updatePassenger(index, e.target.value)}
                          className="flex-1"
                        />
                        {passengers.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removePassengerField(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={editTrip?.date}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time"
                    name="time"
                    type="time"
                    defaultValue={editTrip?.time || editTrip?.start_time}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_time">Return Time (Optional)</Label>
                <Input 
                  id="return_time"
                  name="return_time"
                  type="time"
                  defaultValue={editTrip?.return_time || editTrip?.end_time}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Vehicle</Label>
                  <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
                    <SelectTrigger id="vehicle_id">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.registration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver_id">Driver</Label>
                  <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
                    <SelectTrigger id="driver_id">
                      <SelectValue placeholder="Select driver" />
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
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input 
                    id="pickup_location"
                    name="pickup_location"
                    placeholder="Enter pickup location"
                    defaultValue={editTrip?.pickup_location || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoff_location">Dropoff Location</Label>
                  <Input 
                    id="dropoff_location"
                    name="dropoff_location"
                    placeholder="Enter dropoff location"
                    defaultValue={editTrip?.dropoff_location || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_notes">Notes</Label>
                <Textarea 
                  id="special_notes"
                  name="special_notes"
                  placeholder="Add any special instructions or notes"
                  defaultValue={editTrip?.special_notes || editTrip?.notes?.replace(/\n\nPassengers:\n.*$/s, '') || ""}
                  className="min-h-[80px]"
                />
              </div>

              {editTrip && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editTrip.status} required>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!editTrip && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_recurring" 
                    name="is_recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked === true)}
                  />
                  <Label htmlFor="is_recurring" className="cursor-pointer">This is a recurring trip</Label>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  if (editTrip) {
                    setEditTrip(null);
                  } else {
                    setBookingOpen(false);
                  }
                  setPassengers([""]);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editTrip ? "Save Changes" : "Book Trip"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              trip and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setTripToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trip Details Dialog */}
      {viewTrip && (
        <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Trip Details</DialogTitle>
              <DialogDescription>
                {formatTripId(viewTrip.id)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Client</p>
                  <p>{viewTrip.client_name}</p>
                  {viewTrip.client_type === "organization" && (
                    <Badge variant="outline" className="mt-1">Organization</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <Badge className={getStatusColor(viewTrip.status)}>
                    {formatStatus(viewTrip.status)}
                  </Badge>
                </div>
              </div>

              {/* Display passengers if organization client */}
              {viewTrip.client_type === "organization" && (
                <div>
                  <p className="text-sm font-semibold">Passengers</p>
                  {parsePassengers(viewTrip.notes).length > 0 ? (
                    <ul className="list-disc list-inside">
                      {parsePassengers(viewTrip.notes).map((passenger, index) => (
                        <li key={index}>{passenger}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No passengers listed</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Date</p>
                  <p>{formatDate(viewTrip.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Time</p>
                  <p>{formatTime(viewTrip.time || viewTrip.start_time)}</p>
                  {viewTrip.return_time && (
                    <p className="text-sm text-muted-foreground">Return: {formatTime(viewTrip.return_time)}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Route</p>
                {viewTrip.pickup_location && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{viewTrip.pickup_location}</span>
                  </div>
                )}
                {viewTrip.dropoff_location && (
                  <div className="flex items-start gap-2 text-sm mt-1">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{viewTrip.dropoff_location}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">Service Type</p>
                <div className="flex items-center gap-1">
                  {getTripTypeIcon(viewTrip.type)}
                  <span>{formatTripType(viewTrip.type, viewTrip)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Driver & Vehicle</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {viewTrip.driver_avatar ? (
                      <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary dark:bg-gray-700 dark:text-gray-300">
                        {viewTrip.driver_name?.charAt(0) || 'D'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm">{viewTrip.driver_name}</p>
                    {viewTrip.driver_contact && (
                      <p className="text-xs text-muted-foreground">{viewTrip.driver_contact}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-2">{viewTrip.vehicle_details}</p>
              </div>

              {viewTrip.notes && (
                <div>
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {viewTrip.notes.replace(/\n\nPassengers:\n.*$/s, '')}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTrip(viewTrip)}>
                Edit Trip
              </Button>
              <Button variant="destructive" onClick={() => {
                setTripToDelete(viewTrip.id);
                setDeleteDialogOpen(true);
                setViewTrip(null);
              }}>
                Delete Trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
