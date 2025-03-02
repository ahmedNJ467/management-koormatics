
import { DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";

export const formatUIServiceType = (trip: DisplayTrip): UIServiceType => {
  if (trip.type === "airport_pickup") return "airport_pickup";
  if (trip.type === "airport_dropoff") return "airport_dropoff";
  if (trip.type === "full_day") return "full_day_hire";
  
  if (trip.type === "other") {
    if (trip.pickup_location?.toLowerCase().includes("airport") || 
        trip.dropoff_location?.toLowerCase().includes("airport")) {
      return "round_trip";
    }
    
    if (trip.notes?.toLowerCase().includes("security") || 
        trip.notes?.toLowerCase().includes("escort")) {
      return "security_escort";
    }
    
    if (trip.start_time && trip.end_time) {
      return "round_trip";
    }
    
    return "one_way";
  }
  
  return "one_way";
};

export const prepareFormData = (formData: FormData, selectedClientType: string, passengers: string[]) => {
  // Add client type to the form data
  if (selectedClientType) {
    formData.append("client_type", selectedClientType);
  }
  
  // Add passengers to the form data if client is an organization
  if (selectedClientType === "organization") {
    // Filter out empty passenger names
    const validPassengers = passengers.filter(name => name.trim().length > 0);
    
    if (validPassengers.length > 0) {
      formData.append("passengers", JSON.stringify(validPassengers));
    }
  }
  
  return formData;
};
