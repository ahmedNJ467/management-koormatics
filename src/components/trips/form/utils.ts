import { Trip, DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";

// Mapping between UI service types and display strings
export const serviceTypeMap: { [key: string]: string } = {
  airport_pickup: "Airport Pickup",
  airport_dropoff: "Airport Dropoff",
  round_trip: "Round Trip",
  security_escort: "Security Escort",
  one_way: "One Way Transfer",
  full_day_hire: "Full Day Hire",
};

export function prepareFormData(formData: FormData, selectedClientType: string, passengers: string[]) {
  // Convert amount to number
  const amountValue = formData.get("amount") as string;
  if (amountValue) {
    const numericAmount = parseFloat(amountValue);
    formData.set("amount", isNaN(numericAmount) ? "0" : numericAmount.toString());
  }
  
  // Handle passengers for organization clients
  if (selectedClientType === "organization") {
    // Clean up passengers list (remove empty entries)
    const cleanPassengers = passengers.filter(p => p.trim());
    
    // Store passengers as JSON string in the form data
    if (cleanPassengers.length > 0) {
      formData.set("passengers", JSON.stringify(cleanPassengers));
    }
  }
}

// Function to format the service type for UI display
export function formatUIServiceType(trip: DisplayTrip | Trip): UIServiceType {
  switch (trip.service_type) {
    case "airport_pickup":
      return "airport_pickup";
    case "airport_dropoff":
      return "airport_dropoff";
    case "round_trip":
      return "round_trip";
    case "security_escort":
      return "security_escort";
    case "one_way_transfer":
      return "one_way";
    case "full_day":
      return "full_day_hire";
    default:
      return "airport_pickup";
  }
}
