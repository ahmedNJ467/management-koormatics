
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus, TripType, DbServiceType } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";
import { serviceTypeMap, mapTripTypeToDbServiceType } from "./service-type-mapping";
import { createRecurringTrips } from "./recurring-operations";

// Handle saving a trip (new or edit)
export const handleSaveTrip = async (
  event: React.FormEvent<HTMLFormElement>,
  editTrip: DisplayTrip | null,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setBookingOpen: (open: boolean) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  
  const uiServiceType = formData.get("service_type") as string;
  const tripType: TripType = (serviceTypeMap[uiServiceType] || "other") as TripType;
  const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
  const isRecurringChecked = formData.get("is_recurring") === "on";
  
  // Extract flight details separately - they now go into their own columns
  const flightNumber = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("flight_number") as string 
    : null;
    
  const airline = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("airline") as string 
    : null;
    
  const terminal = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("terminal") as string 
    : null;
  
  // Get notes without adding flight details
  const notes = formData.get("special_notes") as string || "";
  
  // Get status value directly from form for edit mode
  const statusValue = formData.get("status") as TripStatus || "scheduled";
  
  // Extract passenger data for organization clients
  const clientType = formData.get("client_type") as string;
  
  // Get passengers from the form data
  let passengers: string[] = [];
  const passengersValue = formData.get("passengers");
  
  if (passengersValue) {
    try {
      // Try to parse the passengers JSON string
      passengers = JSON.parse(passengersValue as string);
    } catch (error) {
      console.error("Error parsing passengers:", error);
      // If parsing fails, assume it's a comma-separated string or a single value
      if (typeof passengersValue === 'string') {
        passengers = passengersValue.split(',').map(p => p.trim()).filter(Boolean);
      }
    }
  }
  
  // Log the passenger data being saved
  console.log("Saving trip with client type:", clientType);
  console.log("Saving trip with passengers:", passengers);
  
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
          notes: notes || null,
          status: statusValue, // Use the status field directly
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal,
          passengers: clientType === "organization" ? passengers : null
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
      
      // Update the recurring trips with flight details, status, and passengers
      trips.forEach(trip => {
        trip.flight_number = flightNumber;
        trip.airline = airline; 
        trip.terminal = terminal;
        trip.status = "scheduled";
        trip.passengers = clientType === "organization" ? passengers : null;
      });
      
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
          notes: notes || null,
          status: "scheduled", // Default status
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal,
          passengers: clientType === "organization" ? passengers : null
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
