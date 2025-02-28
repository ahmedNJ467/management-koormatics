import { Trip } from "@/lib/types";
import { UIServiceType, serviceTypeMap } from "./TripFormDialog";

// Helper function to parse flight details from notes
export const parseFlightDetails = (notes?: string) => {
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

// Determine the UI service type for a database trip
export const formatUIServiceType = (trip: Trip): UIServiceType => {
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

// Helper function to get a display name for a trip type
export const getServiceDisplayName = (type: string, uiType?: UIServiceType): string => {
  // Use this mapping for specific UI labels
  const uiTypeLabels: Record<UIServiceType, string> = {
    "airport_pickup": "Airport Pickup",
    "airport_dropoff": "Airport Dropoff",
    "round_trip": "Round Trip",
    "security_escort": "Security Escort",
    "one_way": "One Way Transfer",
    "full_day_hire": "Full Day Hire"
  };
  
  // If we have a UI type, use its label
  if (uiType && uiType in uiTypeLabels) {
    return uiTypeLabels[uiType];
  }
  
  // Otherwise format the database type
  return type.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
