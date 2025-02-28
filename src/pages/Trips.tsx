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
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteTrip, getTrips } from "@/api/trips";
import { Trip, TripSchema } from "@/types";
import { useModal } from "@/hooks/use-modal";
import ViewTrip from "@/components/modals/ViewTrip";
import CreateTrip from "@/components/modals/CreateTrip";
import { useSearchParams } from "react-router-dom";

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
const formatTime = (timeStr: string) => {
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
const parsePassengers = (notes: string) => {
  const regex = /Passenger:\s*([A-Za-z\s]+)/g;
  const passengers = [];
  let match;
  while ((match = regex.exec(notes)) !== null) {
    passengers.push(match[1].trim());
  }
  return passengers;
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
  const { onOpen, onClose } = useModal();
  const [viewTrip, setViewTrip] = useState<Trip | null>(null);

  // Fetch trips data
  const { data: trips, isLoading, isError } = useQuery({
    queryKey: ["trips", date?.toISOString(), statusFilter, searchQuery],
    queryFn: () => getTrips({
      date: date?.toISOString(),
      status: statusFilter,
      search: searchQuery,
    }),
  });

  // Update URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (date) params.set("date", date.toISOString());
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);

    setSearchParams(params);
  }, [date, statusFilter, searchQuery, setSearchParams]);

  // Delete trip mutation
  const deleteTripMutation = useMutation(deleteTrip, {
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip deleted successfully.",
      });
      queryClient.invalidateQueries(["trips"]);
    },
    onError: (error: any) => {
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

  if (isLoading) {
    return <div>Loading trips...</div>;
  }

  if (isError) {
    return <div>Error fetching trips.</div>;
  }

  return (
    <div>
      <ViewTrip
        isOpen={!!viewTrip}
        onClose={() => setViewTrip(null)}
        trip={viewTrip}
      />
      <CreateTrip isOpen={false} onClose={onClose} />

      <div className="md:flex items-center justify-between space-y-4 md:space-y-0">
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Trips</h2>
          <p className="text-muted-foreground">
            Manage and view your trips.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button onClick={() => setCalendarView(!calendarView)}>
            {calendarView ? "Table View" : "Calendar View"}
          </Button>
          <Button onClick={() => onOpen("createTrip")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trip
          </Button>
        </div>
      </div>

      <div className="py-4 flex items-center gap-4">
        <Input
          type="text"
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

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
            {/* Add your calendar component here */}
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
                              <DropdownMenuItem onClick={() => navigate(`/trips/${trip.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  deleteTripMutation.mutate(trip.id);
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
    </div>
  );
}
