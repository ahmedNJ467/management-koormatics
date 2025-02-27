
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
  TripMessage,
  TripAssignment,
} from "@/lib/types";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

// Define custom service types for UI display
type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

// Map UI service types to database TripType values
const serviceTypeMap: Record<UIServiceType, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "other",
  "security_escort": "other",
  "one_way": "other",
  "full_day_hire": "full_day"
};

// Map database TripType values to UI service types - this is the inverse of serviceTypeMap
// This helps us correctly set the form select when editing a trip
const dbToUIServiceType: Record<string, UIServiceType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "full_day": "full_day_hire"
  // "other" type will need special handling because it could be multiple UI types
};

// Helper function to get the specific UI service type from a database trip type and other trip details
const getUIServiceType = (trip: Trip): UIServiceType => {
  // First check if it's a direct mapping
  if (trip.type in dbToUIServiceType) {
    return dbToUIServiceType[trip.type as keyof typeof dbToUIServiceType];
  }
  
  // If it's "other", try to determine the specific service type
  if (trip.type === "other") {
    // These are heuristics - you may need additional metadata in your database to be more accurate
    if (trip.pickup_location?.toLowerCase().includes("airport") || 
        trip.dropoff_location?.toLowerCase().includes("airport")) {
      return "round_trip";
    }
    
    // If notes mention security/escort
    if (trip.notes?.toLowerCase().includes("security") || 
        trip.notes?.toLowerCase().includes("escort")) {
      return "security_escort";
    }
    
    // Default to one_way if we can't determine
    return "one_way";
  }
  
  // Fallback
  return "one_way";
};

// Helper function to get a display name for a trip type
const getServiceDisplayName = (type: TripType, uiType?: UIServiceType): string => {
  // Use this mapping for specific UI labels
  const uiTypeLabels: Record<UIServiceType, string> = {
    "airport_pickup": "Airport Pickup",
    "airport_dropoff": "Airport Dropoff",
    "round_trip": "Round Trip",
    "security_escort": "Security Escort",
    "one_way": "One Way Transfer",
    "full_day_hire": "Full Day Hire"
  };
  
  // If we have a UI type, use its label
  if (uiType && uiType in uiTypeLabels) {
    return uiTypeLabels[uiType];
  }
  
  // Fallback to generic database type formatting
  const dbTypeLabels: Record<TripType, string> = {
    "airport_pickup": "Airport Pickup",
    "airport_dropoff": "Airport Dropoff",
    "other": "Other Service",
    "hourly": "Hourly Service",
    "full_day": "Full Day Service",
    "multi_day": "Multi-Day Service"
  };
  
  return dbTypeLabels[type] || type.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [assignDriver, setAssignDriver] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [calendarView, setCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceType, setServiceType] = useState<UIServiceType>("airport_pickup");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Calculate calendar days
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip) => {
        // Determine the UI service type for this trip
        const uiServiceType = getUIServiceType(trip);
        
        return {
          ...trip,
          client_name: trip.clients?.name || "Unknown Client",
          vehicle_details: `${trip.vehicles?.make} ${trip.vehicles?.model} (${trip.vehicles?.registration})`,
          driver_name: trip.drivers?.name || "Unknown Driver",
          driver_avatar: trip.drivers?.avatar_url,
          driver_contact: trip.drivers?.contact,
          // Map database fields to UI fields
          time: trip.start_time,
          return_time: trip.end_time,
          special_notes: trip.notes,
          // Save the UI service type for easier display/editing
          ui_service_type: uiServiceType
        };
      }) as DisplayTrip[];
    },
  });

  // Fetch trip messages
  const { data: messages } = useQuery({
    queryKey: ["tripMessages", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the messages
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", viewTrip.id)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data as TripMessageData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch trip assignments
  const { data: assignments } = useQuery({
    queryKey: ["tripAssignments", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the assignments with driver details
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(`
          *,
          drivers:driver_id(name, avatar_url)
        `)
        .eq("trip_id", viewTrip.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.drivers?.name,
        driver_avatar: assignment.drivers?.avatar_url
      })) as TripAssignmentData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch clients, vehicles, and drivers for forms
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Client[];
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
      return data as Vehicle[];
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
      return data as Driver[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("trips-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trips" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to messages changes
  useEffect(() => {
    if (!viewTrip) return;
    
    const channel = supabase
      .channel("trip-messages-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${viewTrip.id}` }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["tripMessages", viewTrip.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, viewTrip]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messages?.length && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // When setting editTrip, set the service type for the form
  useEffect(() => {
    if (editTrip) {
      // Determine the UI service type for this trip
      const uiType = getUIServiceType(editTrip);
      setServiceType(uiType);
    }
  }, [editTrip]);

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

  // Delete trip
  const deleteTrip = async () => {
    if (!tripToDelete) return;
    
    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripToDelete);

      if (error) throw error;

      toast({
        title: "Trip deleted",
        description: "Trip has been deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setDeleteDialogOpen(false);
      setTripToDelete(null);
      
      // Close any open dialogs if they were showing the deleted trip
      if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
      if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Create recurring trips
  const createRecurringTrips = async (formData: FormData, occurrences: number, frequency: "daily" | "weekly" | "monthly") => {
    const trips = [];
    const baseDate = new Date(formData.get("date") as string);
    
    for (let i = 0; i < occurrences; i++) {
      let tripDate = new Date(baseDate);
      
      if (i > 0) {
        switch (frequency) {
          case "daily":
            tripDate = addDays(tripDate, i);
            break;
          case "weekly":
            tripDate = addDays(tripDate, i * 7);
            break;
          case "monthly":
            tripDate = new Date(tripDate.setMonth(tripDate.getMonth() + i));
            break;
        }
      }
      
      const formServiceType = formData.get("service_type") as UIServiceType;
      const dbServiceType = serviceTypeMap[formServiceType];
      
      const formTime = formData.get("time") as string;
      const formReturnTime = formData.get("return_time") as string;
      
      const tripData = {
        client_id: formData.get("client_id") as string,
        vehicle_id: formData.get("vehicle_id") as string,
        driver_id: formData.get("driver_id") as string,
        date: format(tripDate, "yyyy-MM-dd"),
        start_time: formTime,
        end_time: formReturnTime || null,
        type: dbServiceType,
        status: "scheduled" as TripStatus,
        amount: 0, // Default amount
        pickup_location: formData.get("pickup_location") as string || null,
        dropoff_location: formData.get("dropoff_location") as string || null,
        notes: formData.get("special_notes") as string || null,
      };
      
      trips.push(tripData);
    }
    
    return trips;
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const uiServiceType = formData.get("service_type") as UIServiceType;
    const dbServiceType = serviceTypeMap[uiServiceType];
    const isRecurringChecked = formData.get("is_recurring") === "on";
    
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
            type: dbServiceType,
            status: formData.get("status") as TripStatus,
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            notes: formData.get("special_notes") as string || null,
          })
          .eq("id", editTrip.id);
        
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else if (isRecurringChecked) {
        // Create recurring trips
        const occurrences = parseInt(formData.get("occurrences") as string) || 1;
        const frequencyValue = formData.get("frequency") as "daily" | "weekly" | "monthly";
        
        const trips = await createRecurringTrips(formData, occurrences, frequencyValue);
        
        const { error } = await supabase
          .from("trips")
          .insert(trips);
        
        if (error) throw error;

        toast({
          title: "Recurring trips created",
          description: `${trips.length} trips have been scheduled successfully`,
        });
        
        setBookingOpen(false);
      } else {
        // Create new single trip
        const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
        
        const { error } = await supabase
          .from("trips")
          .insert({
            client_id: formData.get("client_id") as string,
            vehicle_id: formData.get("vehicle_id") as string,
            driver_id: formData.get("driver_id") as string,
            date: formData.get("date") as string,
            start_time: formData.get("time") as string,
            end_time: needsReturnTime ? (formData.get("return_time") as string) : null,
            type: dbServiceType,
            status: formData.get("status") as TripStatus || "scheduled",
            amount: 0, // Default amount
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            notes: formData.get("special_notes") as string || null,
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

  // Handle assigning a driver
  const handleAssignDriver = async () => {
    if (!tripToAssign || !assignDriver) return;
    
    try {
      // Skip the RPC and use direct insertion
      const { error } = await supabase.from('trip_assignments').insert({
        trip_id: tripToAssign.id,
        driver_id: assignDriver,
        assigned_at: new Date().toISOString(),
        status: "pending",
        notes: assignNote || null
      });
      
      if (error) throw error;
      
      // Update trip with new driver
      const { error: updateError } = await supabase
        .from("trips")
        .update({ driver_id: assignDriver })
        .eq("id", tripToAssign.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["tripAssignments", tripToAssign.id] });
      
      setAssignOpen(false);
      setTripToAssign(null);
      setAssignDriver("");
      setAssignNote("");
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!tripToMessage || !newMessage.trim()) return;
    
    try {
      // Skip the RPC and use direct insertion
      const { error } = await supabase.from('trip_messages').insert({
        trip_id: tripToMessage.id,
        sender_type: "admin",
        sender_name: "Fleet Manager", // In a real app, use the current user's name
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: false
      });
      
      if (error) throw error;
      
      toast({
        title: "Message sent",
        description: "Your message has been sent",
      });
      
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["tripMessages", tripToMessage.id] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Helper functions for formatting
  const formatStatus = (status: TripStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Format service type for display
  const formatTripType = (type: TripType, trip?: DisplayTrip): string => {
    // If we have the trip object with a UI service type, use that for more precise display
    if (trip && 'ui_service_type' in trip) {
      const uiType = trip.ui_service_type as UIServiceType;
      return getServiceDisplayName(type, uiType);
    }
    
    // Fallback to general display based on trip type
    return getServiceDisplayName(type);
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
  };
  
  const formatDateTime = (dateTimeStr: string): string => {
    return format(new Date(dateTimeStr), "MMM d, yyyy h:mm a");
  };
  
  const getStatusColor = (status: TripStatus): string => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format trip ID to show first 8 characters
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  // Get appropriate icon based on service type
  const getTripTypeIcon = (type: TripType) => {
    switch (type) {
      case "airport_pickup":
      case "airport_dropoff":
        return <Plane className="h-4 w-4" />;
      case "other":
        return <ArrowRight className="h-4 w-4" />;
      case "hourly":
        return <Clock className="h-4 w-4" />;
      case "full_day":
        return <Calendar className="h-4 w-4" />;
      case "multi_day":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  // Filter trips based on search and status filter
  const filteredTrips = trips?.filter(trip => {
    const matchesSearch = 
      searchTerm === "" ||
      trip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatTripId(trip.id).includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (tripsLoading) {
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
    <div className="space-y-8 animate-fade-in">
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
            {calendarView ? <Table className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Calendar View */}
      {calendarView ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              Previous Month
            </Button>
            <h3 className="text-xl font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              Next Month
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
              <div key={`empty-${index}`} className="p-4 border rounded-md bg-gray-50" />
            ))}

            {daysInMonth.map((day) => {
              const tripsOnDay = trips?.filter(trip => 
                trip.date === format(day, "yyyy-MM-dd")
              );
              
              return (
                <div 
                  key={day.toString()} 
                  className={`p-2 border rounded-md min-h-[100px] ${
                    isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="font-medium mb-1">{format(day, "d")}</div>
                  
                  <div className="space-y-1">
                    {tripsOnDay && tripsOnDay.length > 0 ? (
                      tripsOnDay.slice(0, 3).map(trip => (
                        <div 
                          key={trip.id}
                          onClick={() => setViewTrip(trip)}
                          className="text-xs p-1 rounded cursor-pointer bg-primary/10 hover:bg-primary/20 truncate"
                          title={`${trip.client_name} - ${formatTripType(trip.type, trip)}`}
                        >
                          {formatTime(trip.time)} {trip.client_name}
                        </div>
                      ))
                    ) : null}
                    
                    {tripsOnDay && tripsOnDay.length > 3 ? (
                      <div className="text-xs text-muted-foreground text-center">
                        +{tripsOnDay.length - 3} more
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // List View
        !filteredTrips || filteredTrips.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trips Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No trips match your search criteria"
                : "Schedule a new trip to get started"}
            </p>
            <Button onClick={() => setBookingOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Book Trip
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewTrip(trip)}>
                    <TableCell>{formatTripId(trip.id)}</TableCell>
                    <TableCell>{trip.client_name}</TableCell>
                    <TableCell>
                      {formatDate(trip.date)}
                      <div className="text-xs text-muted-foreground">
                        {trip.time && `Time: ${formatTime(trip.time)}`}
                        {trip.return_time && <div>Return: {formatTime(trip.return_time)}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTripTypeIcon(trip.type)}
                        {formatTripType(trip.type, trip)}
                      </div>
                    </TableCell>
                    <TableCell>{trip.vehicle_details}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {trip.driver_avatar ? (
                            <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
                          ) : (
                            <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        {trip.driver_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(trip.status)}>
                        {formatStatus(trip.status)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                            <FileText className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                            <FileText className="mr-2 h-4 w-4" /> Edit Trip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTripToAssign(trip);
                            setAssignOpen(true);
                          }}>
                            <User className="mr-2 h-4 w-4" /> Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTripToMessage(trip);
                            setMessageOpen(true);
                          }}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "in_progress")} disabled={trip.status === "in_progress"}>
                            <Clock className="mr-2 h-4 w-4" /> Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "completed")} disabled={trip.status === "completed"}>
                            <Check className="mr-2 h-4 w-4" /> Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "cancelled")} disabled={trip.status === "cancelled"}>
                            <X className="mr-2 h-4 w-4" /> Mark Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setTripToDelete(trip.id);
                            setDeleteDialogOpen(true);
                          }} className="text-red-500">
                            <Trash className="mr-2 h-4 w-4" /> Delete Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* View Trip Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Trip Details {viewTrip && <span className="text-muted-foreground ml-2 font-normal text-base">#{formatTripId(viewTrip.id)}</span>}
            </DialogTitle>
            <DialogDescription>
              {viewTrip && (
                <div className="flex items-center gap-2 mt-1 text-sm">
                  {getTripTypeIcon(viewTrip.type)}
                  <span>{formatTripType(viewTrip.type, viewTrip)}</span>
                  {viewTrip.is_recurring && (
                    <Badge variant="secondary" className="ml-2">
                      <Repeat className="mr-1 h-3 w-3" /> Recurring
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewTrip && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Trip Details</TabsTrigger>
                <TabsTrigger value="communication">Messages ({messages?.length || 0})</TabsTrigger>
                <TabsTrigger value="history">Assignment History ({assignments?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Badge variant="outline" className={getStatusColor(viewTrip.status)}>
                        {formatStatus(viewTrip.status)}
                      </Badge>
                      <span className="ml-2">
                        {formatDate(viewTrip.date)} 
                        {viewTrip.time && ` at ${formatTime(viewTrip.time)}`}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Client</h4>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p>{viewTrip.client_name}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Vehicle</h4>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <p>{viewTrip.vehicle_details}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Driver</h4>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {viewTrip.driver_avatar ? (
                              <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                            ) : (
                              <AvatarFallback>{viewTrip.driver_name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p>{viewTrip.driver_name}</p>
                            {viewTrip.driver_contact && (
                              <p className="text-xs text-muted-foreground">{viewTrip.driver_contact}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Return Time</h4>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p>{viewTrip.return_time ? formatTime(viewTrip.return_time) : "Not specified"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Pickup Location</h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p>{viewTrip.pickup_location || "Not specified"}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Dropoff Location</h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p>{viewTrip.dropoff_location || "Not specified"}</p>
                        </div>
                      </div>
                    </div>

                    {viewTrip.special_notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Special Notes</h4>
                        <p className="text-sm p-3 bg-muted rounded-md">{viewTrip.special_notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-between border-t pt-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditTrip(viewTrip)}>
                        Edit Trip
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setTripToAssign(viewTrip);
                          setAssignOpen(true);
                        }}
                      >
                        Assign Driver
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateTripStatus(viewTrip.id, 
                          viewTrip.status === "scheduled" ? "in_progress" : 
                          viewTrip.status === "in_progress" ? "completed" : "scheduled"
                        )}
                        disabled={viewTrip.status === "cancelled"}
                      >
                        {viewTrip.status === "scheduled" ? "Mark In Progress" : 
                         viewTrip.status === "in_progress" ? "Mark Completed" : "Reactivate"}
                      </Button>
                      {viewTrip.status !== "cancelled" && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateTripStatus(viewTrip.id, "cancelled")}
                        >
                          Cancel Trip
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      {messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 ${
                                message.sender_type === "admin" 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">{message.sender_name}</span>
                                  <span className="text-xs opacity-70">{formatDateTime(message.timestamp)}</span>
                                </div>
                                <p className="text-sm">{message.message}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={messageEndRef} />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p>No messages yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex items-center border-t pt-4">
                    <div className="flex w-full gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setTripToMessage(viewTrip);
                          setMessageOpen(true);
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments && assignments.length > 0 ? (
                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {assignment.driver_avatar ? (
                                    <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name || 'Driver'} />
                                  ) : (
                                    <AvatarFallback>{assignment.driver_name ? assignment.driver_name.charAt(0) : 'D'}</AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium">{assignment.driver_name || "Unknown Driver"}</p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(assignment.assigned_at)}</p>
                                </div>
                              </div>
                              <Badge variant={
                                assignment.status === "accepted" ? "default" : 
                                assignment.status === "rejected" ? "destructive" : "secondary"
                              }>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </Badge>
                            </div>
                            {assignment.notes && (
                              <div className="text-sm bg-muted p-2 rounded-md mt-2">
                                <p>{assignment.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No assignment history</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Trip Form Dialog (Edit & Create) */}
      <Dialog open={!!editTrip || bookingOpen} onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
            <DialogDescription>
              {editTrip 
                ? `Edit trip details for ${editTrip.client_name}`
                : "Create a new trip reservation"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTrip} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select name="client_id" defaultValue={editTrip?.client_id} required>
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select 
                  name="service_type" 
                  value={serviceType}
                  onValueChange={(value) => setServiceType(value as UIServiceType)}
                  required
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="one_way">One Way Transfer</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                    <SelectItem value="full_day_hire">Full Day Hire</SelectItem>
                    <SelectItem value="security_escort">Security Escort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            {/* Show return time for round trips, security escorts, and full day hires */}
            {["round_trip", "security_escort", "full_day_hire"].includes(serviceType) && (
              <div className="space-y-2">
                <Label htmlFor="return_time">Return Time</Label>
                <Input 
                  id="return_time"
                  name="return_time"
                  type="time"
                  defaultValue={editTrip?.return_time || editTrip?.end_time}
                />
              </div>
            )}

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
                defaultValue={editTrip?.special_notes || editTrip?.notes || ""}
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

            {!editTrip && isRecurring && (
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="occurrences">Number of Occurrences</Label>
                  <Input 
                    id="occurrences"
                    name="occurrences"
                    type="number"
                    defaultValue="4"
                    min="2"
                    required={isRecurring}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    name="frequency" 
                    value={frequency}
                    onValueChange={(value) => setFrequency(value as "daily" | "weekly" | "monthly")}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => editTrip ? setEditTrip(null) : setBookingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editTrip ? "Save Changes" : "Book Trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Driver Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              {tripToAssign && (
                <span>Assign a driver to trip on {formatDate(tripToAssign.date)} for {tripToAssign.client_name}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver_select">Select Driver</Label>
              <Select value={assignDriver} onValueChange={setAssignDriver}>
                <SelectTrigger id="driver_select">
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
            
            <div className="space-y-2">
              <Label htmlFor="assignment_note">Note (Optional)</Label>
              <Textarea 
                id="assignment_note"
                placeholder="Add a note for this assignment"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignOpen(false);
              setAssignDriver("");
              setAssignNote("");
              setTripToAssign(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignDriver}
              disabled={!assignDriver}
            >
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              {tripToMessage && (
                <span>Send a message about the trip on {formatDate(tripToMessage.date)} for {tripToMessage.client_name}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message_content">Message</Label>
              <Textarea 
                id="message_content"
                placeholder="Type your message here"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageOpen(false);
              setNewMessage("");
              setTripToMessage(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the trip and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setTripToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteTrip}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
