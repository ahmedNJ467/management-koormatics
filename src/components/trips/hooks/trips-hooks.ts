
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus, convertToDisplayTrips } from "@/lib/types/trip";
import { useEffect } from "react";
import { 
  parseFlightDetails, 
  parsePassengers,
  serviceTypeMap,
  createRecurringTrips
} from "@/components/trips/utils/trip-helpers";

export function useTripsState() {
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

  return {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    viewTrip, setViewTrip,
    editTrip, setEditTrip,
    bookingOpen, setBookingOpen,
    assignOpen, setAssignOpen,
    messageOpen, setMessageOpen,
    tripToAssign, setTripToAssign,
    tripToMessage, setTripToMessage,
    assignDriver, setAssignDriver,
    assignNote, setAssignNote,
    newMessage, setNewMessage,
    deleteDialogOpen, setDeleteDialogOpen,
    tripToDelete, setTripToDelete,
    activeTab, setActiveTab,
    calendarView, setCalendarView,
    currentMonth, setCurrentMonth
  };
}

export function useTripsActions(
  toast: any,
  viewTrip: DisplayTrip | null,
  setViewTrip: (trip: DisplayTrip | null) => void,
  editTrip: DisplayTrip | null,
  setEditTrip: (trip: DisplayTrip | null) => void,
  tripToDelete: string | null,
  setDeleteDialogOpen: (open: boolean) => void,
  setTripToDelete: (id: string | null) => void,
  setBookingOpen: (open: boolean) => void,
  tripToMessage: DisplayTrip | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  setMessageOpen: (open: boolean) => void,
  tripToAssign: DisplayTrip | null,
  assignDriver: string,
  setAssignDriver: (id: string) => void,
  assignNote: string,
  setAssignNote: (note: string) => void,
  setAssignOpen: (open: boolean) => void,
) {
  // Update trip status
  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    try {
      // Fix: Explicitly type the update object and use 'status' as a key
      const { error } = await supabase
        .from("trips")
        .update({ status } as any)
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status changed successfully`,
      });
      
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

      if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
      if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
      
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const uiServiceType = formData.get("service_type") as string;
    const dbServiceType = serviceTypeMap[uiServiceType];
    const isRecurringChecked = formData.get("is_recurring") === "on";
    
    let notes = formData.get("special_notes") as string || "";
    if (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") {
      const flight = formData.get("flight_number") as string;
      const airline = formData.get("airline") as string;
      const terminal = formData.get("terminal") as string;
      
      if (flight) notes += `\nFlight: ${flight}`;
      if (airline) notes += `\nAirline: ${airline}`;
      if (terminal) notes += `\nTerminal: ${terminal}`;
    }
    
    const clientId = formData.get("client_id") as string;
    const clientType = form.querySelector(`option[value="${clientId}"]`)?.getAttribute('data-client-type');
    
    if (clientType === "organization") {
      const passengerInputs = form.querySelectorAll('input[placeholder^="Passenger"]');
      const passengersList: string[] = [];
      
      passengerInputs.forEach((input) => {
        const value = (input as HTMLInputElement).value;
        if (value.trim()) {
          passengersList.push(value.trim());
        }
      });
      
      if (passengersList.length > 0) {
        notes += `\n\nPassengers:\n${passengersList.join('\n')}`;
      }
    }
    
    try {
      if (editTrip) {
        const tripUpdateData = {
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
        };
        
        const { error } = await supabase
          .from("trips")
          .update(tripUpdateData)
          .eq("id", editTrip.id);
        
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else if (isRecurringChecked) {
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
          amount: 0,
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
      }
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
      const { error } = await supabase.from('trip_assignments').insert({
        trip_id: tripToAssign.id,
        driver_id: assignDriver,
        assigned_at: new Date().toISOString(),
        status: "pending",
        notes: assignNote || null
      });
      
      if (error) throw error;
      
      const { error: updateError } = await supabase
        .from("trips")
        .update({ driver_id: assignDriver })
        .eq("id", tripToAssign.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });
      
      setAssignOpen(false);
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
      const { error } = await supabase.from('trip_messages').insert({
        trip_id: tripToMessage.id,
        sender_type: "admin",
        sender_name: "Fleet Manager",
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

  return {
    updateTripStatus,
    deleteTrip,
    handleSaveTrip,
    handleAssignDriver,
    handleSendMessage
  };
}

export function useTripsQuery() {
  const queryClient = useQueryClient();

  // Setup real-time subscription
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

  return useQuery({
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

      // Convert to DisplayTrip objects
      return convertToDisplayTrips(data);
    },
  });
}

export function useTripMessagesQuery(tripId: string | null) {
  const queryClient = useQueryClient();

  // Setup real-time subscription for messages
  useEffect(() => {
    if (!tripId) return;
    
    const channel = supabase
      .channel("trip-messages-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["tripMessages", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tripId]);

  return useQuery({
    queryKey: ["tripMessages", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useTripAssignmentsQuery(tripId: string | null) {
  return useQuery({
    queryKey: ["tripAssignments", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(`
          *,
          drivers:driver_id(name, avatar_url)
        `)
        .eq("trip_id", tripId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.drivers?.name,
        driver_avatar: assignment.drivers?.avatar_url
      }));
    },
    enabled: !!tripId,
  });
}
