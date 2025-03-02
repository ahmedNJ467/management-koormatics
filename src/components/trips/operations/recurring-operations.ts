import { format, addDays } from "date-fns";
import { TripType, DbServiceType } from "@/lib/types/trip";
import { serviceTypeMap, mapTripTypeToDbServiceType } from "./service-type-mapping";

export const createRecurringTrips = async (
  formData: FormData,
  occurrences: number,
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<any[]> => {
  const uiServiceType = formData.get("service_type") as string;
  const tripType = (serviceTypeMap[uiServiceType] || "other") as TripType;
  const dbServiceType = mapTripTypeToDbServiceType(tripType);
  const baseDate = new Date(formData.get("date") as string);
  
  // Prepare notes with status prefix
  let notes = formData.get("special_notes") as string || "";
  
  // Add flight details to notes if relevant
  if (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") {
    const flight = formData.get("flight_number") as string;
    const airline = formData.get("airline") as string;
    const terminal = formData.get("terminal") as string;
    
    if (flight) notes += `\nFlight: ${flight}`;
    if (airline) notes += `\nAirline: ${airline}`;
    if (terminal) notes += `\nTerminal: ${terminal}`;
  }
  
  // Add status
  notes = `STATUS:scheduled\n\n${notes}`;
  
  const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
  
  const trips = [];
  
  for (let i = 0; i < occurrences; i++) {
    // Calculate trip date based on frequency
    const tripDate = new Date(baseDate);
    if (frequency === 'daily') {
      tripDate.setDate(baseDate.getDate() + i);
    } else if (frequency === 'weekly') {
      tripDate.setDate(baseDate.getDate() + (i * 7));
    } else if (frequency === 'monthly') {
      tripDate.setMonth(baseDate.getMonth() + i);
    }
    
    trips.push({
      client_id: formData.get("client_id") as string,
      vehicle_id: formData.get("vehicle_id") as string,
      driver_id: formData.get("driver_id") as string,
      date: tripDate.toISOString().split('T')[0],
      time: formData.get("time") as string,
      return_time: needsReturnTime ? (formData.get("return_time") as string) : null,
      service_type: dbServiceType,
      amount: 0, // Default amount
      pickup_location: formData.get("pickup_location") as string || null,
      dropoff_location: formData.get("dropoff_location") as string || null,
      notes: notes,
      is_recurring: true
    });
  }
  
  return trips;
};
