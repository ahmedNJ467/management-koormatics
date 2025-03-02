
import { DbTrip, Trip, DisplayTrip } from "./trip-data";
import { extractTripStatus } from "@/components/trips/utils";
import { tripTypeDisplayMap } from "./base-types";
import { TripStatus } from "./base-types";

// Map from database fields to the application trip model
export function mapDatabaseFieldsToTrip(dbTrip: any): DisplayTrip {
  const {
    clients,
    vehicles,
    drivers,
    ...tripData
  } = dbTrip;

  // Extract client details
  const clientName = clients?.name || "Unknown Client";
  const clientType = clients?.type;

  // Extract vehicle details
  const vehicleDetails = vehicles 
    ? `${vehicles.make} ${vehicles.model} (${vehicles.registration})` 
    : "No Vehicle";

  // Extract driver details
  const driverName = drivers?.name || "No Driver";
  const driverAvatar = drivers?.avatar_url;
  const driverContact = drivers?.contact;

  // Get the trip status from the status field, rather than extracting from notes
  // with a fallback to the legacy method for backward compatibility
  // Ensure status is a valid TripStatus type
  const rawStatus = tripData.status || extractTripStatus(tripData.notes) || "scheduled";
  const status = validateTripStatus(rawStatus);

  // Format type for display
  const displayType = tripTypeDisplayMap[tripData.service_type] || "Other Service";

  // Create the merged trip object
  const trip: DisplayTrip = {
    ...tripData as Trip,
    status,
    client_name: clientName,
    client_type: clientType,
    vehicle_details: vehicleDetails,
    driver_name: driverName,
    driver_avatar: driverAvatar,
    driver_contact: driverContact,
    display_type: displayType,
    type: tripData.service_type || "other", // Legacy field
    special_notes: tripData.notes, // Ensure notes is available as special_notes for backward compatibility
  };
  
  return trip;
}

// Helper function to validate that a status string is a valid TripStatus
export function validateTripStatus(status: string): TripStatus {
  const validStatuses: TripStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  
  if (validStatuses.includes(status as TripStatus)) {
    return status as TripStatus;
  }
  
  return 'scheduled'; // Default fallback
}

// Re-export extractFlightInfo for backward compatibility
export { extractFlightInfo } from "@/components/trips/utils";
