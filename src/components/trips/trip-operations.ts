import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus, TripType, mapTripTypeToDbServiceType, DbServiceType } from "@/lib/types/trip";
import { format, addDays } from "date-fns";
import { toast as useToast } from "@/hooks/use-toast";
import { QueryClient } from "@tanstack/react-query";

// Map UI service types to database service_type values
// Making sure all TripType values are included
export const serviceTypeMap: Record<string, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "round_trip",
  "security_escort": "security_escort",
  "one_way": "one_way_transfer",
  "full_day_hire": "full_day",
  "hourly": "hourly",
  "multi_day": "multi_day",
  "other": "other"
};

// Update trip status
export const updateTripStatus = async (
  tripId: string, 
  status: TripStatus, 
  viewTrip: DisplayTrip | null, 
  setViewTrip: (trip: DisplayTrip | null) => void,
  toast: ReturnType<typeof useToast>,
  queryClient: QueryClient
) => {
  try {
    // Note: We only update a custom status field in our app, not in DB schema
    const { error } = await supabase
      .from("trips")
      .update({ 
        // Store status in special_instructions with a prefix
        special_instructions: `STATUS:${status}${
          viewTrip?.special_instructions ? 
            `\n\n${viewTrip.special_instructions.replace(/^STATUS:[a-z_]+\n\n/i, '')}` : 
            ''
        }`
      })
      .eq("id", tripId);

    if (error) throw error;

    toast({
      title: "Trip updated",
      description: `Trip status changed to ${status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}`,
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
export const deleteTrip = async (
  tripToDelete: string | null,
  viewTrip: DisplayTrip | null,
  editTrip: DisplayTrip | null,
  setViewTrip: (trip: DisplayTrip | null) => void,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setDeleteDialogOpen: (open: boolean) => void,
  setTripToDelete: (id: string | null) => void,
  toast: ReturnType<typeof useToast>,
  queryClient: QueryClient
) => {
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
export const createRecurringTrips = async (
  formData: FormData, 
  occurrences: number, 
  frequency: "daily" | "weekly" | "monthly"
) => {
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
    
    const formServiceType = formData.get("service_type") as string;
    const tripType: TripType = serviceTypeMap[formServiceType] || "other";
    const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
    
    const formTime = formData.get("time") as string;
    const formReturnTime = formData.get("return_time") as string;
    
    // Prepare trip data for insertion into the DB
    const tripData = {
      client_id: formData.get("client_id") as string,
      vehicle_id: formData.get("vehicle_id") as string,
      driver_id: formData.get("driver_id") as string,
      date: format(tripDate, "yyyy-MM-dd"),
      time: formTime,
      return_time: formReturnTime || null,
      service_type: dbServiceType,
      amount: 0, // Default amount
      pickup_location: formData.get("pickup_location") as string || null,
      dropoff_location: formData.get("dropoff_location") as string || null,
      special_instructions: `STATUS:scheduled\n\n${formData.get("special_notes") as string || ""}`,
    };
    
    trips.push(tripData);
  }
  
  return trips;
};

// Handle saving a trip (new or edit)
export const handleSaveTrip = async (
  event: React.FormEvent<HTMLFormElement>,
  editTrip: DisplayTrip | null,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setBookingOpen: (open: boolean) => void,
  toast: ReturnType<typeof useToast>,
  queryClient: QueryClient
) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  
  const uiServiceType = formData.get("service_type") as string;
  const tripType: TripType = (serviceTypeMap[uiServiceType] || "other") as TripType;
  const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
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
  
  // Add status prefix to notes
  const statusValue = formData.get("status") as TripStatus || "scheduled";
  notes = `STATUS:${statusValue}\n\n${notes}`;
  
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
          time: formData.get("time") as string,
          return_time: formData.get("return_time") as string || null,
          service_type: dbServiceType,
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          special_instructions: notes || null,
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
          time: formData.get("time") as string,
          return_time: needsReturnTime ? (formData.get("return_time") as string) : null,
          service_type: dbServiceType,
          amount: 0, // Default amount
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          special_instructions: notes || null,
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
export const handleAssignDriver = async (
  tripToAssign: DisplayTrip | null,
  assignDriver: string,
  assignNote: string,
  setAssignOpen: (open: boolean) => void,
  setTripToAssign: (trip: DisplayTrip | null) => void,
  setAssignDriver: (id: string) => void,
  setAssignNote: (note: string) => void,
  toast: ReturnType<typeof useToast>,
  queryClient: QueryClient
) => {
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
export const handleSendMessage = async (
  tripToMessage: DisplayTrip | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  toast: ReturnType<typeof useToast>,
  queryClient: QueryClient
) => {
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
