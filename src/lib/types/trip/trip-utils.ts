
import { extractTripStatus } from "@/components/trips/utils";
import { TripType, DbServiceType, tripTypeDisplayMap } from "./base-types";
import { DisplayTrip, DbTrip, Trip } from "./trip-data";
import { parsePassengers } from "@/components/trips/utils";

export const mapDatabaseFieldsToTrip = (dbTrip: any): DisplayTrip => {
  // Ensure all required properties are present with defaults
  const dbServiceType = dbTrip.service_type || "other";
  
  // Extract status from special_instructions
  const status = dbTrip.status || extractTripStatus(dbTrip.special_instructions) || "scheduled";
  
  // Map to TripType, handling unknown types
  let type: TripType = dbServiceType as TripType;
  if (!Object.keys(tripTypeDisplayMap).includes(type)) {
    // If not a valid TripType, default to "other"
    type = "other";
  }
  
  // Extract passengers from special_instructions
  const passengers = parsePassengers(dbTrip.special_instructions);
  
  return {
    ...dbTrip,
    // Map database fields to Trip interface properties
    type,
    status,
    start_time: dbTrip.time || dbTrip.start_time,
    end_time: dbTrip.return_time || dbTrip.end_time,
    notes: dbTrip.special_instructions,
    // Remove status prefix from display notes
    special_notes: dbTrip.special_instructions?.replace(/^STATUS:[a-z_]+\n\n/i, ''),
    // Additional display fields
    client_name: dbTrip.clients?.name || "Unknown Client",
    client_type: dbTrip.clients?.type,
    vehicle_details: dbTrip.vehicles ? 
      `${dbTrip.vehicles.make || ""} ${dbTrip.vehicles.model || ""} (${dbTrip.vehicles.registration || ""})` : 
      "Vehicle details not available",
    driver_name: dbTrip.drivers?.name || "Driver not assigned",
    driver_avatar: dbTrip.drivers?.avatar_url,
    driver_contact: dbTrip.drivers?.contact,
    // Include additional fields for displaying in UI
    display_type: dbTrip.display_type || tripTypeDisplayMap[dbServiceType] || 'Other',
    // Add passengers array for easy access
    passengers
  };
};

// Map our application TripType to the database-acceptable DbServiceType
export const mapTripTypeToDbServiceType = (type: TripType): DbServiceType => {
  switch (type) {
    case 'airport_pickup':
    case 'airport_dropoff':
    case 'round_trip':
    case 'security_escort':
    case 'one_way_transfer':
    case 'full_day':
      return type as DbServiceType;
    case 'hourly':
    case 'multi_day':
    case 'other':
    default:
      // Default to a service type the database accepts
      return 'one_way_transfer' as DbServiceType;
  }
};

export const mapTripToDatabaseFields = (trip: Partial<Trip>): Partial<DbTrip> => {
  // Create a new object with the database field names
  const dbTrip: Partial<DbTrip> = {
    ...trip,
    // Map Trip interface fields to database fields
    service_type: trip.type ? mapTripTypeToDbServiceType(trip.type) : undefined,
    time: trip.start_time,
    return_time: trip.end_time,
    special_instructions: trip.notes,
  };
  
  return dbTrip;
};

export const extractFlightInfo = (notes?: string): string => {
  if (!notes) return '';
  
  let flightInfo = '';
  
  const flightNumberMatch = notes.match(/Flight:?\s*([A-Z0-9]{2,}\s*[0-9]{1,4}[A-Z]?)/i);
  const airlineMatch = notes.match(/Airline:?\s*([^,\n]+)/i);
  const terminalMatch = notes.match(/Terminal:?\s*([^,\n]+)/i);
  
  if (flightNumberMatch) {
    flightInfo += `${flightNumberMatch[1].trim()}`;
  }
  
  if (airlineMatch) {
    flightInfo += flightInfo ? `, ${airlineMatch[1].trim()}` : `${airlineMatch[1].trim()}`;
  }
  
  if (terminalMatch) {
    flightInfo += flightInfo ? `, ${terminalMatch[1].trim()}` : `${terminalMatch[1].trim()}`;
  }
  
  return flightInfo;
};
