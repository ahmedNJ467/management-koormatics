
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
  Trip,
  DisplayTrip,
  TripStatus,
  TripType,
  convertToDisplayTrip,
  tripTypeDisplayMap,
} from "@/lib/types/trip";
import { Driver } from "@/lib/types/driver";
import { Vehicle } from "@/lib/types/vehicle";
import { Client } from "@/components/clients/hooks/use-clients-query";

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

      // Convert returned data to DisplayTrip objects
      return data.map((trip) => {
        // Add the required type and status fields if they're missing
        const tripWithDefaults = {
          ...trip,
          // Ensure type and status are set
          type: trip.type || trip.service_type || 'other' as TripType,
          status: trip.status || 'scheduled' as TripStatus,
        };
        
        // Determine the UI service type for this trip
        const uiServiceType = formatUIServiceType(tripWithDefaults);
        
        return {
          ...tripWithDefaults,
          client_name: trip.clients?.name || "Unknown Client",
          client_type: trip.clients?.type || "individual",
          vehicle_details: `${trip.vehicles?.make || ''} ${trip.vehicles?.model || ''} ${trip.vehicles?.registration ? `(${trip.vehicles.registration})` : ''}`.trim() || "Unknown Vehicle",
          driver_name: trip.drivers?.name || "Unknown Driver",
          driver_avatar: trip.drivers?.avatar_url,
          driver_contact: trip.drivers?.contact,
          // Map database fields to UI fields
          special_notes: trip.notes || trip.special_instructions,
          ui_service_type: uiServiceType,
          // Ensure these fields exist with proper names
          start_time: trip.start_time || trip.time,
          end_time: trip.end_time || trip.return_time,
          notes: trip.notes || trip.special_instructions,
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
      return data;
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
      }));
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
      
        const tripData = {
          client_id: formData.get("client_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          driver_id: formData.get("driver_id") as string,
          date: formData.get("date") as string,
          start_time: formData.get("time") as string,
          end_time: needsReturnTime ? (formData.get("return_time") as string) : null,
          type: dbServiceType,
          status: "scheduled" as TripStatus,
          amount: 0, // Default amount
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: notes || null,
        };

        const { error } = await supabase
          .from("trips")
          .insert(tripData);
        
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
            <SelectItem value="all">All Statuses</SelectItem>
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
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              Previous Month
            </Button>
            <h3 className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              Next Month
            </Button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Days of the week */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div key={i} className="text-center font-semibold p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: getFirstDayOfMonth(daysInMonth[0]) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 rounded p-2 min-h-[120px]"></div>
            ))}
            
            {/* Calendar days */}
            {daysInMonth.map((day) => {
              // Get trips for this day
              const dayTrips = filteredTrips?.filter(trip => 
                isSameDay(new Date(trip.date), day)
              ) || [];
              
              return (
                <div 
                  key={day.toString()} 
                  className={`bg-white border rounded p-2 min-h-[120px] ${
                    isSameDay(day, new Date()) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="font-medium mb-1">{format(day, "d")}</div>
                  <div className="space-y-1 overflow-auto max-h-[100px]">
                    {dayTrips.length > 0 ? (
                      dayTrips.slice(0, 3).map(trip => (
                        <div 
                          key={trip.id}
                          className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(trip.status)}`}
                          onClick={() => setViewTrip(trip)}
                        >
                          {formatTime(trip.start_time)} - {trip.client_name.split(' ')[0]}
                        </div>
                      ))
                    ) : null}
                    {dayTrips.length > 3 && (
                      <div className="text-xs text-center text-gray-500">
                        +{dayTrips.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips && filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="font-medium">{formatDate(trip.date)}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(trip.start_time)}
                        {trip.end_time && ` - ${formatTime(trip.end_time)}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trip.client_type === "organization" ? (
                          <Shield className="h-4 w-4 text-blue-500" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <div className="font-medium">{trip.client_name}</div>
                          <div className="text-sm text-gray-500">{formatTripId(trip.id)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTripTypeIcon(trip.type)}
                        <span>{formatTripType(trip.type, trip)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={trip.driver_avatar || ""} />
                          <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{trip.driver_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{trip.vehicle_details}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(trip.status)}`}>
                        {formatStatus(trip.status)}
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
                          <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                            Edit Trip
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setTripToMessage(trip);
                            setMessageOpen(true);
                          }}>
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTripToAssign(trip);
                            setAssignOpen(true);
                          }}>
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={trip.status === "scheduled"}
                            onClick={() => updateTripStatus(trip.id, "scheduled")}
                          >
                            Mark as Scheduled
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={trip.status === "in_progress"}
                            onClick={() => updateTripStatus(trip.id, "in_progress")}
                          >
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={trip.status === "completed"}
                            onClick={() => updateTripStatus(trip.id, "completed")}
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={trip.status === "cancelled"}
                            onClick={() => updateTripStatus(trip.id, "cancelled")}
                          >
                            Mark as Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setTripToDelete(trip.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    {searchTerm || statusFilter !== "all" ? (
                      <>
                        <div className="text-lg font-semibold">No trips found</div>
                        <div className="text-gray-500">Try adjusting your search or filter settings.</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-semibold">No trips booked</div>
                        <div className="text-gray-500">Get started by adding your first trip.</div>
                        <Button className="mt-4" onClick={() => setBookingOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Book Trip
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Trip Dialog */}
      <Dialog open={viewTrip !== null} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100">
                {getTripTypeIcon(viewTrip?.type || "other")}
              </div>
              {viewTrip ? formatTripType(viewTrip.type, viewTrip) : "Trip Details"}
            </DialogTitle>
            <DialogDescription>
              Trip ID: {viewTrip ? formatTripId(viewTrip.id) : ""}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pb-6">
              {viewTrip && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Client Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{viewTrip.client_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{viewTrip.client_name}</div>
                            <div className="text-sm text-gray-500">{viewTrip.client_type || "Individual"}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Driver Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={viewTrip.driver_avatar || ""} />
                            <AvatarFallback>{viewTrip.driver_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{viewTrip.driver_name}</div>
                            {viewTrip.driver_contact && (
                              <div className="text-sm text-gray-500">{viewTrip.driver_contact}</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Trip Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Date</div>
                          <div>{formatDate(viewTrip.date)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Time</div>
                          <div>
                            {formatTime(viewTrip.start_time)}
                            {viewTrip.end_time && ` - ${formatTime(viewTrip.end_time)}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Status</div>
                          <Badge className={`${getStatusColor(viewTrip.status)}`}>
                            {formatStatus(viewTrip.status)}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Vehicle</div>
                          <div>{viewTrip.vehicle_details}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Pickup Location</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{viewTrip.pickup_location || "Not specified"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Dropoff Location</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{viewTrip.dropoff_location || "Not specified"}</span>
                        </div>
                      </div>
                      
                      {(viewTrip.ui_service_type === "airport_pickup" || viewTrip.ui_service_type === "airport_dropoff") && (
                        <div className="space-y-4">
                          <div className="text-sm font-medium">Flight Information</div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Flight Number</div>
                              <div>{viewTrip.flight_number || parseFlightDetails(viewTrip.notes).flight || "Not specified"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Airline</div>
                              <div>{viewTrip.airline || parseFlightDetails(viewTrip.notes).airline || "Not specified"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Terminal</div>
                              <div>{viewTrip.terminal || parseFlightDetails(viewTrip.notes).terminal || "Not specified"}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Check if there are passengers in the notes */}
                      {viewTrip.client_type === "organization" && parsePassengers(viewTrip.notes).length > 0 && (
                        <div>
                          <div className="text-sm font-medium">Passengers</div>
                          <ul className="list-disc pl-5 mt-1">
                            {parsePassengers(viewTrip.notes).map((passenger, index) => (
                              <li key={index}>{passenger}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium">Notes</div>
                        <div className="text-gray-600 whitespace-pre-wrap">
                          {viewTrip.notes || "No additional notes"}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setViewTrip(null)}>
                        Close
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditTrip(viewTrip);
                            setViewTrip(null);
                          }}
                        >
                          Edit Trip
                        </Button>
                        <Button 
                          onClick={() => {
                            setTripToMessage(viewTrip);
                            setMessageOpen(true);
                            setViewTrip(null);
                          }}
                        >
                          Send Message
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="messages" className="pb-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Trip Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[380px] px-6 py-4">
                    {messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_type === "admin"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.sender_type === "admin"
                                  ? "bg-blue-100 text-blue-900"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="text-xs font-medium mb-1">
                                {msg.sender_name} ({formatDateTime(msg.timestamp)})
                              </div>
                              <div className="whitespace-pre-wrap">{msg.message}</div>
                            </div>
                          </div>
                        ))}
                        <div ref={messageEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        No messages for this trip yet.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-3 flex items-center gap-2 border-t">
                  <Button 
                    className="h-10 w-10 p-2 rounded-full" 
                    variant="ghost"
                    onClick={() => {
                      setTripToMessage(viewTrip);
                      setMessageOpen(true);
                      setViewTrip(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-gray-500">
                    Click to add a new message
                  </span>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="pb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Assignment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments && assignments.length > 0 ? (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.driver_avatar || ""} />
                              <AvatarFallback>
                                {assignment.driver_name ? assignment.driver_name.charAt(0) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{assignment.driver_name || "Unknown Driver"}</div>
                              <div className="text-xs text-gray-500">
                                Assigned on {formatDateTime(assignment.assigned_at)}
                              </div>
                            </div>
                            <Badge 
                              className={
                                assignment.status === "accepted" ? "bg-green-100 text-green-800" : 
                                assignment.status === "rejected" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </Badge>
                          </div>
                          {assignment.notes && (
                            <div className="ml-11 text-sm text-gray-600">
                              <div className="font-medium text-xs text-gray-500">Notes:</div>
                              <div>{assignment.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No assignment history for this trip.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Trip Booking/Edit Dialog */}
      <Dialog open={bookingOpen || editTrip !== null} onOpenChange={(open) => {
        if (!open) {
          setBookingOpen(false);
          setEditTrip(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
            <DialogDescription>
              {editTrip
                ? "Update the details for this trip."
                : "Enter the details to book a new trip."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveTrip}>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select
                    name="service_type"
                    value={serviceType}
                    onValueChange={(value) => setServiceType(value as UIServiceType)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                      <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                      <SelectItem value="round_trip">Round Trip</SelectItem>
                      <SelectItem value="security_escort">Security Escort</SelectItem>
                      <SelectItem value="one_way">One Way Transfer</SelectItem>
                      <SelectItem value="full_day_hire">Full Day Hire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select 
                    name="client_id" 
                    value={selectedClientId} 
                    onValueChange={handleClientChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.type === "organization" ? "(Organization)" : "(Individual)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedClientType === "organization" && (
                  <div className="space-y-2">
                    <Label>Passengers</Label>
                    <div className="space-y-2">
                      {passengers.map((passenger, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={passenger}
                            onChange={(e) => updatePassenger(index, e.target.value)}
                            placeholder={`Passenger ${index + 1} name`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePassengerField(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPassengerField}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Passenger
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Driver</Label>
                  <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
                    <SelectTrigger>
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
                  <Label htmlFor="vehicle_id">Vehicle</Label>
                  <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
                    <SelectTrigger>
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
                
                {!editTrip && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_recurring" 
                        name="is_recurring" 
                        checked={isRecurring}
                        onCheckedChange={(checked) => 
                          setIsRecurring(checked === true)
                        }
                      />
                      <Label htmlFor="is_recurring" className="cursor-pointer">Recurring Trip</Label>
                    </div>
                    
                    {isRecurring && (
                      <div className="pl-6 pt-2 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select 
                            name="frequency" 
                            value={frequency}
                            onValueChange={(value) => 
                              setFrequency(value as "daily" | "weekly" | "monthly")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="occurrences">Number of Occurrences</Label>
                          <Input 
                            type="number" 
                            name="occurrences" 
                            min="1" 
                            max="52" 
                            defaultValue="4" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    type="date" 
                    name="date" 
                    defaultValue={editTrip?.date || new Date().toISOString().split("T")[0]} 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Start Time</Label>
                    <Input 
                      type="time" 
                      name="time" 
                      defaultValue={editTrip?.start_time || "09:00"} 
                      required
                    />
                  </div>
                  
                  {(serviceType === "round_trip" || serviceType === "security_escort" || serviceType === "full_day_hire") && (
                    <div className="space-y-2">
                      <Label htmlFor="return_time">End Time</Label>
                      <Input 
                        type="time" 
                        name="return_time" 
                        defaultValue={editTrip?.end_time || "17:00"} 
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input 
                    name="pickup_location" 
                    defaultValue={editTrip?.pickup_location || ""} 
                    placeholder="Enter pickup address" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dropoff_location">Dropoff Location</Label>
                  <Input 
                    name="dropoff_location" 
                    defaultValue={editTrip?.dropoff_location || ""} 
                    placeholder="Enter dropoff address" 
                    required
                  />
                </div>
                
                {(serviceType === "airport_pickup" || serviceType === "airport_dropoff") && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="flight_number">Flight Number</Label>
                      <Input 
                        name="flight_number" 
                        defaultValue={editTrip?.flight_number || parseFlightDetails(editTrip?.notes).flight || ""} 
                        placeholder="e.g. BA123" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="airline">Airline</Label>
                        <Input 
                          name="airline" 
                          defaultValue={editTrip?.airline || parseFlightDetails(editTrip?.notes).airline || ""} 
                          placeholder="e.g. British Airways" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="terminal">Terminal</Label>
                        <Input 
                          name="terminal" 
                          defaultValue={editTrip?.terminal || parseFlightDetails(editTrip?.notes).terminal || ""} 
                          placeholder="e.g. Terminal 5" 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="special_notes">Special Instructions</Label>
                  <Textarea 
                    name="special_notes" 
                    rows={3}
                    defaultValue={editTrip?.notes || ""} 
                    placeholder="Enter any special instructions or requirements" 
                  />
                </div>
                
                {editTrip && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editTrip.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Trip status" />
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
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="secondary" onClick={() => {
                setBookingOpen(false);
                setEditTrip(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editTrip ? "Update Trip" : "Book Trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Driver Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to this trip. They will receive a notification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver-select">Select Driver</Label>
              <Select value={assignDriver} onValueChange={setAssignDriver}>
                <SelectTrigger id="driver-select">
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
              <Label htmlFor="assign-note">Note (Optional)</Label>
              <Textarea 
                id="assign-note"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Add a note for the driver"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignDriver} disabled={!assignDriver}>
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to the client and driver for this trip.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trip-message">Message</Label>
              <Textarea 
                id="trip-message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter your message"
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4 mr-2" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteTrip} 
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
