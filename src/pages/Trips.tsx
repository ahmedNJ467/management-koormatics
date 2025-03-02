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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  TripAssignment,
  tripTypeDisplayMap
} from "@/lib/types/trip";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

// Map service types to icons
const serviceTypeIcons = {
  airport_pickup: <Plane className="h-4 w-4" />,
  airport_dropoff: <Plane className="h-4 w-4" />,
  hourly: <Clock className="h-4 w-4" />,
  full_day: <Calendar className="h-4 w-4" />,
  multi_day: <Calendar className="h-4 w-4" />,
  one_way_transfer: <ArrowRight className="h-4 w-4" />,
  round_trip: <Repeat className="h-4 w-4" />,
  security_escort: <Shield className="h-4 w-4" />,
  other: <Car className="h-4 w-4" />,
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: TripStatus) => {
  switch (status) {
    case 'scheduled':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Helper function to format date for display
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return dateString;
  }
};

// Helper function to format time for display
const formatTime = (timeString?: string) => {
  if (!timeString) return '';
  try {
    return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
  } catch (error) {
    return timeString;
  }
};

const Trips = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [driverResponseDialogOpen, setDriverResponseDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DisplayTrip | null>(null);
  const [tripMessages, setTripMessages] = useState<TripMessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tripAssignments, setTripAssignments] = useState<TripAssignmentData[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<TripAssignmentData | null>(null);
  const [driverResponse, setDriverResponse] = useState<'accepted' | 'rejected' | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  
  // Fetch trips
  const { data: trips = [], isLoading, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          clients (id, name, type),
          vehicles (id, make, model, year, color),
          drivers (id, name, avatar_url, phone)
        `)
        .order('date', { ascending: true });
      
      if (error) {
        toast({
          title: "Error fetching trips",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      // Transform data to match DisplayTrip interface
      return data.map((trip: any): DisplayTrip => ({
        id: trip.id,
        client_id: trip.client_id,
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        date: trip.date,
        start_time: trip.start_time,
        end_time: trip.end_time,
        type: trip.type as TripType,
        status: trip.status as TripStatus,
        amount: trip.amount,
        pickup_location: trip.pickup_location,
        dropoff_location: trip.dropoff_location,
        notes: trip.notes,
        invoice_id: trip.invoice_id,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        // Display fields
        client_name: trip.clients?.name || 'Unknown Client',
        client_type: trip.clients?.type,
        vehicle_details: trip.vehicles ? `${trip.vehicles.year} ${trip.vehicles.make} ${trip.vehicles.model} (${trip.vehicles.color})` : 'No vehicle assigned',
        driver_name: trip.drivers?.name || 'Unassigned',
        driver_avatar: trip.drivers?.avatar_url,
        driver_contact: trip.drivers?.phone,
        time: formatTime(trip.start_time),
        return_time: formatTime(trip.end_time),
        flight_number: trip.flight_number,
        airline: trip.airline,
        terminal: trip.terminal,
        special_notes: trip.special_notes,
        is_recurring: trip.is_recurring || false,
        ui_service_type: tripTypeDisplayMap[trip.type as TripType] || 'Other Service',
      }));
    },
  });

  // Fetch drivers for assignment
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        toast({
          title: "Error fetching drivers",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data;
    },
  });

  // Fetch vehicles for trip creation/editing
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        toast({
          title: "Error fetching vehicles",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data;
    },
  });

  // Fetch clients for trip creation/editing
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        toast({
          title: "Error fetching clients",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data;
    },
  });

  // Handle create dialog
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Handle edit dialog
  const handleOpenEditDialog = (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTrip(null);
  };

  // Handle delete dialog
  const handleOpenDeleteDialog = (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTrip(null);
  };

  // Handle message dialog
  const handleOpenMessageDialog = async (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    
    // Fetch messages for this trip
    const { data, error } = await supabase
      .from('trip_messages')
      .select('*')
      .eq('trip_id', trip.id)
      .order('timestamp', { ascending: true });
    
    if (error) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setTripMessages(data as TripMessageData[]);
    setMessageDialogOpen(true);
  };

  const handleCloseMessageDialog = () => {
    setMessageDialogOpen(false);
    setSelectedTrip(null);
    setTripMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!selectedTrip || !newMessage.trim()) return;
    
    const messageData = {
      trip_id: selectedTrip.id,
      sender_type: 'admin',
      sender_name: 'Admin User', // Replace with actual admin name
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
    };
    
    const { error } = await supabase
      .from('trip_messages')
      .insert(messageData);
    
    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Refresh messages
    const { data } = await supabase
      .from('trip_messages')
      .select('*')
      .eq('trip_id', selectedTrip.id)
      .order('timestamp', { ascending: true });
    
    setTripMessages(data as TripMessageData[]);
    setNewMessage('');
    
    toast({
      title: "Message sent",
      description: "Your message has been sent successfully.",
    });
  };

  // Handle assign driver dialog
  const handleOpenAssignDriverDialog = async (trip: DisplayTrip) => {
    setSelectedTrip(trip);
    
    // Fetch existing assignments for this trip
    const { data, error } = await supabase
      .from('trip_assignments')
      .select(`
        *,
        drivers (name, avatar_url)
      `)
      .eq('trip_id', trip.id);
    
    if (error) {
      toast({
        title: "Error fetching assignments",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Transform data to include driver name and avatar
    const transformedData = data.map((assignment: any) => ({
      ...assignment,
      driver_name: assignment.drivers?.name,
      driver_avatar: assignment.drivers?.avatar_url,
    }));
    
    setTripAssignments(transformedData);
    setAssignDriverDialogOpen(true);
  };

  const handleCloseAssignDriverDialog = () => {
    setAssignDriverDialogOpen(false);
    setSelectedTrip(null);
    setTripAssignments([]);
    setSelectedDriver(null);
    setAssignmentNotes('');
  };

  const handleAssignDriver = async () => {
    if (!selectedTrip || !selectedDriver) return;
    
    const assignmentData = {
      trip_id: selectedTrip.id,
      driver_id: selectedDriver,
      assigned_at: new Date().toISOString(),
      status: 'pending',
      notes: assignmentNotes.trim() || null,
    };
    
    const { error } = await supabase
      .from('trip_assignments')
      .insert(assignmentData);
    
    if (error) {
      toast({
        title: "Error assigning driver",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Refresh assignments
    const { data } = await supabase
      .from('trip_assignments')
      .select(`
        *,
        drivers (name, avatar_url)
      `)
      .eq('trip_id', selectedTrip.id);
    
    // Transform data to include driver name and avatar
    const transformedData = data.map((assignment: any) => ({
      ...assignment,
      driver_name: assignment.drivers?.name,
      driver_avatar: assignment.drivers?.avatar_url,
    }));
    
    setTripAssignments(transformedData);
    setSelectedDriver(null);
    setAssignmentNotes('');
    
    toast({
      title: "Driver assigned",
      description: "The driver has been assigned to this trip.",
    });
  };

  // Handle driver response dialog
  const handleOpenDriverResponseDialog = (assignment: TripAssignmentData) => {
    setSelectedAssignment(assignment);
    setDriverResponseDialogOpen(true);
  };

  const handleCloseDriverResponseDialog = () => {
    setDriverResponseDialogOpen(false);
    setSelectedAssignment(null);
    setDriverResponse(null);
    setResponseNotes('');
  };

  const handleDriverResponse = async () => {
    if (!selectedAssignment || !driverResponse) return;
    
    const { error } = await supabase
      .from('trip_assignments')
      .update({
        status: driverResponse,
        notes: responseNotes.trim() || selectedAssignment.notes,
      })
      .eq('id', selectedAssignment.id);
    
    if (error) {
      toast({
        title: "Error updating assignment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // If accepted, update the trip with the driver
    if (driverResponse === 'accepted' && selectedTrip) {
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          driver_id: selectedAssignment.driver_id,
        })
        .eq('id', selectedAssignment.trip_id);
      
      if (tripError) {
        toast({
          title: "Error updating trip",
          description: tripError.message,
          variant: "destructive",
        });
      }
    }
    
    // Refresh assignments
    const { data } = await supabase
      .from('trip_assignments')
      .select(`
        *,
        drivers (name, avatar_url)
      `)
      .eq('trip_id', selectedAssignment.trip_id);
    
    // Transform data to include driver name and avatar
    const transformedData = data.map((assignment: any) => ({
      ...assignment,
      driver_name: assignment.drivers?.name,
      driver_avatar: assignment.drivers?.avatar_url,
    }));
    
    setTripAssignments(transformedData);
    
    // Refresh trips data
    refetch();
    
    handleCloseDriverResponseDialog();
    
    toast({
      title: `Assignment ${driverResponse}`,
      description: `The driver has ${driverResponse} the trip assignment.`,
    });
  };

  // Handle date selection in calendar view
  const handleDateSelect = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date()) ? null : date);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Create a new trip
  const handleCreateTrip = async (tripData: Partial<Trip>) => {
    const { error } = await supabase
      .from('trips')
      .insert(tripData);
    
    if (error) {
      toast({
        title: "Error creating trip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    refetch();
    handleCloseCreateDialog();
    
    toast({
      title: "Trip created",
      description: "The trip has been created successfully.",
    });
  };

  // Edit an existing trip
  const handleEditTrip = async (tripData: Partial<Trip>) => {
    if (!selectedTrip) return;
    
    const { error } = await supabase
      .from('trips')
      .update(tripData)
      .eq('id', selectedTrip.id);
    
    if (error) {
      toast({
        title: "Error updating trip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    refetch();
    handleCloseEditDialog();
    
    toast({
      title: "Trip updated",
      description: "The trip has been updated successfully.",
    });
  };

  // Delete a trip
  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', selectedTrip.id);
    
    if (error) {
      toast({
        title: "Error deleting trip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    refetch();
    handleCloseDeleteDialog();
    
    toast({
      title: "Trip deleted",
      description: "The trip has been deleted successfully.",
    });
  };

  // Navigate to previous month in calendar
  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  // Navigate to next month in calendar
  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  // Generate calendar days for the current month
  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Get all days in the month
    const days = eachDayOfInterval({ start, end });
    
    // Adjust to start from Sunday of the week containing the 1st
    const firstDayOfMonth = days[0];
    const daysToSubtract = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    const startDate = addDays(firstDayOfMonth, -daysToSubtract);
    
    // Generate 42 days (6 weeks) to ensure consistent calendar size
    const calendarDays = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));
    
    setCalendarDays(calendarDays);
  }, [currentDate]);

  // Filter trips based on search query and selected date
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = searchQuery
      ? trip.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.pickup_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.dropoff_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesDate = selectedDate
      ? isSameDay(new Date(trip.date), selectedDate)
      : true;
    
    return viewMode === 'calendar' ? matchesSearch : (matchesSearch && matchesDate);
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trips</h1>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Trip
        </Button>
      </div>
      
      <div className="mb-6">
        <Tabs defaultValue="list" onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search trips..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
          
          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">No trips found. Create a new trip to get started.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Dropoff</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{formatDate(trip.date)}</TableCell>
                        <TableCell>{trip.time || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{trip.client_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {serviceTypeIcons[trip.type] || <Car className="h-4 w-4" />}
                            <span>{trip.ui_service_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.pickup_location ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{trip.pickup_location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {trip.dropoff_location ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{trip.dropoff_location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={trip.driver_avatar} />
                              <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{trip.driver_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(trip.status)}>
                            {trip.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(trip)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenMessageDialog(trip)}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Messages
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenAssignDriverDialog(trip)}>
                                <User className="mr-2 h-4 w-4" />
                                Assign Driver
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleOpenDeleteDialog(trip)}
                                className="text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Trip
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  Previous Month
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  Next Month
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium p-2">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, i) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  
                  // Get trips for this day
                  const dayTrips = trips.filter((trip) => isSameDay(new Date(trip.date), day));
                  
                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] border rounded-md p-1 ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'border-primary' : ''} ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleDateSelect(day)}
                    >
                      <div className="text-right p-1">
                        <span className={`text-sm font-medium ${isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {dayTrips.slice(0, 3).map((trip) => (
                          <div
                            key={trip.id}
                            className="text-xs p-1 rounded bg-primary/10 truncate cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(trip);
                            }}
                          >
                            {trip.time && <span className="font-medium">{trip.time} - </span>}
                            {trip.client_name}
                          </div>
                        ))}
                        
                        {dayTrips.length > 3 && (
                          <div className="text-xs text-center text-muted-foreground">
                            +{dayTrips.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Trip Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>
              Enter the details for the new trip.
            </DialogDescription>
          </DialogHeader>
          <CreateTripForm
            clients={clients}
            vehicles={vehicles}
            drivers={drivers}
            onCreate={handleCreateTrip}
            onClose={handleCloseCreateDialog}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Trip Dialog */}
      {selectedTrip && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Trip</DialogTitle>
              <DialogDescription>
                Update the details for this trip.
              </DialogDescription>
            </DialogHeader>
            <EditTripForm
              trip={selectedTrip}
              clients={clients}
              vehicles={vehicles}
              drivers={drivers}
              onEdit={handleEditTrip}
              onClose={handleCloseEditDialog}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Trip Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the trip
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Messages Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Messages</DialogTitle>
            <DialogDescription>
              {selectedTrip && (
                <span>
                  {formatDate(selectedTrip.date)} - {selectedTrip.client_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              {tripMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {tripMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">
                          {message.sender_name}
                        </div>
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Assign Driver Dialog */}
      <Dialog open={assignDriverDialogOpen} onOpenChange={setAssignDriverDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              {selectedTrip && (
                <span>
                  {formatDate(selectedTrip.date)} - {selectedTrip.client_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="driver">Select Driver</Label>
              <Select value={selectedDriver || ''} onValueChange={setSelectedDriver}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions for the driver..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
            
            {tripAssignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Previous Assignments</h4>
                <div className="space-y-2">
                  {tripAssignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.driver_avatar} />
                              <AvatarFallback>{assignment.driver_name?.charAt(0) || 'D'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{assignment.driver_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(assignment.assigned_at), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              assignment.status === 'accepted'
                                ? 'success'
                                : assignment.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                        {assignment.notes && (
                          <div className="mt-2 text-sm border-t pt-2">
                            {assignment.notes}
                          </div>
                        )}
                        {assignment.status === 'pending' && (
                          <div className="mt-2 flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDriverResponseDialog(assignment)}
                            >
                              Respond as Driver
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAssignDriverDialog}>
              Cancel
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriver}>
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Driver Response Dialog */}
      <Dialog open={driverResponseDialogOpen} onOpenChange={setDriverResponseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Driver Response</DialogTitle>
            <DialogDescription>
              Respond to this trip assignment as the driver.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={driverResponse === 'accepted' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDriverResponse('accepted')}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button
                variant={driverResponse === 'rejected' ? 'destructive' : 'outline'}
                className="flex-1"
                onClick={() => setDriverResponse('rejected')}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            
            <div>
              <Label htmlFor="response-notes">Notes (Optional)</Label>
              <Textarea
                id="response-notes"
                placeholder="Add any notes about your response..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDriverResponseDialog}>
              Cancel
            </Button>
            <Button onClick={handleDriverResponse} disabled={!driverResponse}>
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create placeholder components for referenced but undefined components
const CreateTripForm = ({ clients, vehicles, drivers, onCreate, onClose }) => {
  // Placeholder component
  return <div>Trip form placeholder</div>;
};

const EditTripForm = ({ trip, clients, vehicles, drivers, onEdit, onClose }) => {
  // Placeholder component
  return <div>Edit form placeholder</div>;
};

const TripMessages = ({ trip, messages, onSendMessage, onClose }) => {
  // Placeholder component
  return <div>Messages placeholder</div>;
};

export default Trips;
