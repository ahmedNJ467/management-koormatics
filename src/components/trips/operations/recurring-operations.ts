
import { format, addDays } from "date-fns";
import { TripType, DbServiceType } from "@/lib/types/trip";
import { serviceTypeMap, mapTripTypeToDbServiceType } from "./service-type-mapping";

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
