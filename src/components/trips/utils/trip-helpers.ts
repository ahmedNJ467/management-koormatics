
import { format } from "date-fns";
import { Trip, TripStatus, TripType, DisplayTrip } from "@/lib/types/trip";
import { Plane, ArrowRight, Clock, Calendar } from "lucide-react";

// Format service type for display
export const formatUIServiceType = (trip: Trip): string => {
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

// Helper function to parse passengers from notes
export const parsePassengers = (notes?: string): string[] => {
  if (!notes) return [];
  
  const passengersMatch = notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1].split('\n').filter(p => p.trim());
  }
  
  return [];
};

// Format different trip properties
export const formatTripId = (id: string): string => {
  return id.substring(0, 8).toUpperCase();
};

export const formatStatus = (status: TripStatus): string => {
  return status.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Format service type for display
export const formatTripType = (type: TripType, trip?: DisplayTrip): string => {
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

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "MMM d, yyyy");
};

export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return "";
  return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
};

export const formatDateTime = (dateTimeStr: string): string => {
  return format(new Date(dateTimeStr), "MMM d, yyyy h:mm a");
};

export const getStatusColor = (status: TripStatus): string => {
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

// Get appropriate icon name based on service type
export const getTripTypeIcon = (type: TripType): { icon: string, size: string } => {
  switch (type) {
    case "airport_pickup":
    case "airport_dropoff":
      return { icon: "plane", size: "h-4 w-4" };
    case "other":
      return { icon: "arrow-right", size: "h-4 w-4" };
    case "hourly":
      return { icon: "clock", size: "h-4 w-4" };
    case "full_day":
      return { icon: "calendar", size: "h-4 w-4" };
    case "multi_day":
      return { icon: "calendar", size: "h-4 w-4" };
    default:
      return { icon: "arrow-right", size: "h-4 w-4" };
  }
};

// Map UI service types to database TripType values
export const serviceTypeMap: Record<string, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "other",
  "security_escort": "other",
  "one_way": "other",
  "full_day_hire": "full_day"
};

// Helper function for creating recurring trips
export const createRecurringTrips = async (formData: FormData, occurrences: number, frequency: "daily" | "weekly" | "monthly") => {
  const trips = [];
  const baseDate = new Date(formData.get("date") as string);
  
  for (let i = 0; i < occurrences; i++) {
    let tripDate = new Date(baseDate);
    
    if (i > 0) {
      switch (frequency) {
        case "daily":
          tripDate.setDate(tripDate.getDate() + i);
          break;
        case "weekly":
          tripDate.setDate(tripDate.getDate() + (i * 7));
          break;
        case "monthly":
          tripDate.setMonth(tripDate.getMonth() + i);
          break;
      }
    }
    
    const formServiceType = formData.get("service_type") as string;
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
