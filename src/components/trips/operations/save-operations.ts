import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, TripStatus, TripType, DbServiceType } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";
import { serviceTypeMap, mapTripTypeToDbServiceType } from "./service-type-mapping";
import { createRecurringTrips } from "./recurring-operations";

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
  
  const flightNumber = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("flight_number") as string 
    : null;
    
  const airline = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("airline") as string 
    : null;
    
  const terminal = (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") 
    ? formData.get("terminal") as string 
    : null;
  
  const notes = formData.get("special_notes") as string || "";
  
  const statusValue = formData.get("status") as TripStatus || "scheduled";
  
  const clientType = formData.get("client_type") as string;
  
  let passengers: string[] = [];
  const passengersValue = formData.get("passengers");
  
  if (passengersValue) {
    try {
      passengers = JSON.parse(passengersValue as string);
    } catch (error) {
      console.error("Error parsing passengers:", error);
      if (typeof passengersValue === 'string') {
        passengers = passengersValue.split(',').map(p => p.trim()).filter(Boolean);
      }
    }
  }
  
  const amountValue = formData.get("amount") as string;
  const amount = amountValue ? parseFloat(amountValue) : 0;
  
  console.log("Saving trip with client type:", clientType);
  console.log("Saving trip with passengers:", passengers);
  
  try {
    if (editTrip) {
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
          status: statusValue,
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal,
          passengers: clientType === "organization" ? passengers : null,
          amount: amount
        })
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
      
      trips.forEach(trip => {
        trip.flight_number = flightNumber;
        trip.airline = airline; 
        trip.terminal = terminal;
        trip.status = "scheduled";
        trip.passengers = clientType === "organization" ? passengers : null;
        trip.amount = amount;
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
          amount: amount,
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: notes || null,
          status: "scheduled",
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
