
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
  "round_trip": "other",
  "security_escort": "other",
  "one_way": "other",
  "full_day_hire": "full_day"
};

// Helper function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// Helper function to parse flight details from notes
const parseFlightDetails = (notes?: string) => {
  if (!notes) return { flight: null, airline: null, terminal: null };
  
  const flightMatch = notes.match(/Flight: ([^\n]+)/);
  const airlineMatch = notes.match(/Airline: ([^\n]+)/);
  const terminalMatch = notes.match(/Terminal: ([^\n]+)/);
  
  return {
    flight: flightMatch ? flightMatch[1].trim() : null,
    airline: airlineMatch ? airlineMatch[1].trim() : null,
    terminal: terminalMatch ? terminalMatch[1].trim() : null
  };
};

// Helper function to parse passengers from notes
const parsePassengers = (notes?: string): string[] => {
  if (!notes) return [];
  
  const passengersMatch = notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1].split('\n').filter(p => p.trim());
  }
  
  return [];
};

// Format service type for display
const formatUIServiceType = (trip: Trip): UIServiceType => {
  // For known direct mappings
  if (trip.type === "airport_pickup") return "airport_pickup";
  if (trip.type === "airport_dropoff") return "airport_dropoff";
  if (trip.type === "full_day") return "full_day_hire";
  
  // For "other" type, try to determine the specific service type
  if (trip.type === "other") {
    // If pickup/dropoff has "airport" in it, it might be related to airport service
    if (trip.pickup_location?.toLowerCase().includes("airport") || 
        trip.dropoff_location?.toLowerCase().includes("airport")) {
      return "round_trip";
    }
    
    // Check for keywords in notes
    if (trip.notes?.toLowerCase().includes("security") || 
        trip.notes?.toLowerCase().includes("escort")) {
      return "security_escort";
    }
    
    // Check if there's both start and end time, suggesting round trip
    if (trip.start_time && trip.end_time) {
      return "round_trip";
    }
    
    // Default to one-way if we can't determine
    return "one_way";
  }
  
  // Default fallback
  return "one_way";
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
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);

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
          clients:client_id(name, email, type),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip) => {
        // Determine the UI service type for this trip
        const uiServiceType = formatUIServiceType(trip);
        
        return {
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
        .select("id, name, type")
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

  // When editing a trip, initialize form values
  useEffect(() => {
    if (editTrip) {
      setServiceType(editTrip.ui_service_type as UIServiceType || formatUIServiceType(editTrip));
      setSelectedClientId(editTrip.client_id);
      
      if (editTrip.client_type === "organization") {
        setSelectedClientType("organization");
        // Extract passengers from notes
        const extractedPassengers = parsePassengers(editTrip.notes);
        setPassengers(extractedPassengers.length > 0 ? extractedPassengers : [""]);
      } else {
        setSelectedClientType("individual");
        setPassengers([""]);
      }
    } else {
      // Reset form values when not editing
      setServiceType("airport_pickup");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
    }
  }, [editTrip]);

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
    
    // Add flight details to notes if it's an airport trip
    let notes = formData.get("special_notes") as string || "";
    if (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") {
      const flight = formData.get("flight_number") as string;
      const airline = formData.get("airline") as string;
      const terminal = formData.get("terminal") as string;
      
      if (flight) notes += `\nFlight: ${flight}`;
      if (airline) notes += `\nAirline: ${airline}`;
      if (terminal) notes += `\nTerminal: ${terminal}`;
    }
    
    // Add passenger names to notes if client is organization
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
            type: dbServiceType,
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
        // Reset passengers after booking
        setPassengers([""]);
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
    if (trip?.ui_service_type) {
      // Custom labels for UI service types
      const labels: Record<string, string> = {
        "airport_pickup": "Airport Pickup",
        "airport_dropoff": "Airport Dropoff",
        "round_trip": "Round Trip",
        "security_escort": "Security Escort",
        "one_way": "One Way Transfer",
        "full_day_hire": "Full Day Hire"
      };
      
      if (trip.ui_service_type in labels) {
        return labels[trip.ui_service_type];
      }
    }
    
    // Fallback
    return type.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trip Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Previous
              </Button>
              <span className="font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: getFirstDayOfMonth(startOfMonth(currentMonth)) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1 border rounded-md bg-muted/30"></div>
              ))}
              
              {/* Calendar days */}
              {daysInMonth.map((day) => {
                const dayTrips = filteredTrips?.filter(trip => {
                  return isSameDay(new Date(trip.date), day);
                }) || [];
                
                return (
                  <div 
                    key={day.toString()} 
                    className={`h-24 p-1 border rounded-md overflow-hidden ${
                      isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : ""
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[calc(100%-22px)]">
                      {dayTrips.slice(0, 3).map((trip) => (
                        <div 
                          key={trip.id}
                          className="text-xs p-1 rounded cursor-pointer bg-primary/10 truncate"
                          onClick={() => setViewTrip(trip)}
                        >
                          {formatTime(trip.time)} - {trip.client_name}
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
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No trips found. Try adjusting your search or create a new trip.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips?.map((trip) => {
                  // Extract passengers from notes
                  const tripPassengers = parsePassengers(trip.notes);
                  
                  return (
                    <TableRow key={trip.id} className="group">
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
                              <AvatarFallback className="bg-primary/10 text-primary">
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Edit Trip
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setTripToMessage(trip);
                                setMessageOpen(true);
                              }}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setTripToAssign(trip);
                                setAssignOpen(true);
                              }}>
                                <User className="h-4 w-4 mr-2" />
                                Assign Driver
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {/* Status change options */}
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>

                              {trip.status !== "scheduled" && (
                                <DropdownMenuItem 
                                  onClick={() => updateTripStatus(trip.id, "scheduled")}
                                  className="text-blue-600"
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Set as Scheduled
                                </DropdownMenuItem>
                              )}

                              {trip.status !== "in_progress" && (
                                <DropdownMenuItem 
                                  onClick={() => updateTripStatus(trip.id, "in_progress")}
                                  className="text-yellow-600"
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Set as In Progress
                                </DropdownMenuItem>
                              )}

                              {trip.status !== "completed" && (
                                <DropdownMenuItem 
                                  onClick={() => updateTripStatus(trip.id, "completed")}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}

                              {trip.status !== "cancelled" && (
                                <DropdownMenuItem 
                                  onClick={() => updateTripStatus(trip.id, "cancelled")}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Trip
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  setTripToDelete(trip.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Trip
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
                    value={serviceType}
                    onValueChange={(value: string) => setServiceType(value as UIServiceType)}
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
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flight Details Section - Only show for airport trips */}
              {(serviceType === "airport_pickup" || serviceType === "airport_dropoff") && (
                <div className="border p-4 rounded-md space-y-4">
                  <h3 className="text-sm font-medium">Flight Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="flight_number">Flight Number</Label>
                      <Input 
                        id="flight_number"
                        name="flight_number"
                        placeholder="e.g. BA123"
                        defaultValue={parseFlightDetails(editTrip?.notes).flight || ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="airline">Airline</Label>
                      <Input 
                        id="airline"
                        name="airline"
                        placeholder="e.g. British Airways"
                        defaultValue={parseFlightDetails(editTrip?.notes).airline || ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="terminal">Terminal</Label>
                      <Input 
                        id="terminal"
                        name="terminal"
                        placeholder="e.g. Terminal 5"
                        defaultValue={parseFlightDetails(editTrip?.notes).terminal || ""}
                      />
                    </div>
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
                  defaultValue={editTrip?.special_notes || editTrip?.notes?.replace(/Flight: .*\n?/g, '')
                                        .replace(/Airline: .*\n?/g, '')
                                        .replace(/Terminal: .*\n?/g, '')
                                        .replace(/\n\nPassengers:\n.*$/s, '') // Remove existing passengers list
                                        .trim() || ""}
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

      {/* Trip Detail View Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          {viewTrip && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      {getTripTypeIcon(viewTrip.type)}
                      {formatTripType(viewTrip.type, viewTrip)}
                    </DialogTitle>
                    <DialogDescription>
                      Trip ID: {formatTripId(viewTrip.id)}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusColor(viewTrip.status)}>
                    {formatStatus(viewTrip.status)}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">
                    Assignment History
                  </TabsTrigger>
                  <TabsTrigger value="messages">
                    Messages {messages?.length ? `(${messages.length})` : ""}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="max-h-[calc(90vh-160px)]">
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Date & Time</h3>
                        <p className="text-sm">{formatDate(viewTrip.date)} at {formatTime(viewTrip.time)}</p>
                        {viewTrip.return_time && (
                          <p className="text-sm text-muted-foreground">Return: {formatTime(viewTrip.return_time)}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Client</h3>
                        <p className="text-sm flex items-center gap-1">
                          {viewTrip.client_name}
                          {viewTrip.client_type === "organization" && (
                            <Badge variant="outline" className="text-xs">Organization</Badge>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Display passengers list if client is organization */}
                    {viewTrip.client_type === "organization" && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Passengers</h3>
                        <div className="text-sm space-y-1">
                          {parsePassengers(viewTrip.notes).length > 0 ? 
                            parsePassengers(viewTrip.notes).map((passenger, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{passenger}</span>
                              </div>
                            )) : 
                            <p className="text-muted-foreground">No passengers listed</p>
                          }
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Route</h3>
                      {viewTrip.pickup_location && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Pickup</div>
                            <div>{viewTrip.pickup_location}</div>
                          </div>
                        </div>
                      )}
                      {viewTrip.dropoff_location && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Dropoff</div>
                            <div>{viewTrip.dropoff_location}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(viewTrip.type === "airport_pickup" || viewTrip.type === "airport_dropoff") && (
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Flight Details</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-medium">Flight</div>
                            <div>{parseFlightDetails(viewTrip.notes).flight || "N/A"}</div>
                          </div>
                          <div>
                            <div className="font-medium">Airline</div>
                            <div>{parseFlightDetails(viewTrip.notes).airline || "N/A"}</div>
                          </div>
                          <div>
                            <div className="font-medium">Terminal</div>
                            <div>{parseFlightDetails(viewTrip.notes).terminal || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Driver & Vehicle</h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {viewTrip.driver_avatar ? (
                            <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {viewTrip.driver_name?.charAt(0) || 'D'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{viewTrip.driver_name}</div>
                          {viewTrip.driver_contact && (
                            <div className="text-xs text-muted-foreground">{viewTrip.driver_contact}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Vehicle:</span> {viewTrip.vehicle_details}
                      </div>
                    </div>

                    {viewTrip.notes && (
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Notes</h3>
                        <div className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                          {viewTrip.notes
                            // Remove flight details and passenger list from notes display 
                            // since we show them in their own sections
                            ?.replace(/Flight: .*\n?/g, '')
                            .replace(/Airline: .*\n?/g, '')
                            .replace(/Terminal: .*\n?/g, '')
                            .replace(/\n\nPassengers:\n.*$/s, '')
                            .trim()}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {assignments?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No driver assignment history available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assignments?.map((assignment) => (
                          <Card key={assignment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {assignment.driver_avatar ? (
                                      <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name} />
                                    ) : (
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {assignment.driver_name?.charAt(0) || 'D'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{assignment.driver_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDateTime(assignment.assigned_at)}
                                    </div>
                                  </div>
                                </div>
                                <Badge 
                                  className={
                                    assignment.status === "accepted" ? "bg-green-100 text-green-700" :
                                    assignment.status === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }
                                >
                                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                </Badge>
                              </div>
                              {assignment.notes && (
                                <div className="text-sm mt-2 bg-muted p-3 rounded-md">
                                  {assignment.notes}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="messages" className="space-y-4">
                    <div className="border rounded-md p-3 h-[300px] flex flex-col">
                      <div className="flex-1 overflow-y-auto mb-3">
                        {messages?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No messages yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages?.map((message) => (
                              <div 
                                key={message.id} 
                                className={`flex flex-col ${
                                  message.sender_type === "admin" ? "items-end" : "items-start"
                                }`}
                              >
                                <div className="text-xs text-muted-foreground mb-1">
                                  {message.sender_name} ({message.sender_type}) - {formatDateTime(message.timestamp)}
                                </div>
                                <div 
                                  className={`p-3 rounded-lg max-w-[80%] ${
                                    message.sender_type === "admin" 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted"
                                  }`}
                                >
                                  {message.message}
                                </div>
                              </div>
                            ))}
                            <div ref={messageEndRef} />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message here..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newMessage.trim()) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="gap-2 sm:gap-0">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTripToAssign(viewTrip);
                      setAssignOpen(true);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Assign Driver
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setTripToMessage(viewTrip);
                      setMessageOpen(true);
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setEditTrip(viewTrip)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setTripToDelete(viewTrip.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to trip {tripToAssign ? formatTripId(tripToAssign.id) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select 
                value={assignDriver} 
                onValueChange={setAssignDriver}
              >
                <SelectTrigger id="driver">
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

            <div className="space-y-2">
              <Label htmlFor="assignment-note">Note (Optional)</Label>
              <Textarea 
                id="assignment-note" 
                placeholder="Add any instructions or notes for the driver"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignOpen(false);
              setTripToAssign(null);
              setAssignDriver("");
              setAssignNote("");
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

      {/* Send Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message regarding trip {tripToMessage ? formatTripId(tripToMessage.id) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageOpen(false);
              setTripToMessage(null);
              setNewMessage("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleSendMessage();
                setMessageOpen(false);
              }}
              disabled={!newMessage.trim()}
            >
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
            <AlertDialogAction onClick={deleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
