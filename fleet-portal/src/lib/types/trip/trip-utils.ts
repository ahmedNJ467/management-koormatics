import { DbTrip, Trip, DisplayTrip } from "./trip-data";
import { TripStatus } from "./base-types";

// Map from database fields to the application trip model
export function mapDatabaseFieldsToTrip(dbTrip: any): DisplayTrip {
  const { clients, vehicles, drivers, ...tripData } = dbTrip;

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
  const rawStatus = tripData.status || "scheduled";
  const status = validateTripStatus(rawStatus);

  // Format type for display
  const displayType = tripData.service_type || "Other Service";

  // Create the merged trip object
  const trip: DisplayTrip = {
    ...(tripData as Trip),
    status,
    client_name: clientName,
    client_type: clientType,
    vehicle_details: vehicleDetails,
    driver_name: driverName,
    driver_avatar: driverAvatar,
    driver_contact: driverContact,
    display_type: displayType,
    type: tripData.service_type || "one_way_transfer", // Legacy field, default to valid TripType
    special_notes: tripData.notes, // Ensure notes is available as special_notes for backward compatibility
    passengers: tripData.passengers || [],
    // Explicitly include security escort fields
    has_security_escort: tripData.has_security_escort || false,
    escort_count: tripData.escort_count || 0,
    escort_vehicle_ids: tripData.escort_vehicle_ids || [],
    escort_status: tripData.escort_status || "not_assigned",
    escort_assigned_at: tripData.escort_assigned_at,

    // Stops array
    stops: tripData.stops || [],
    soft_skin_count: tripData.soft_skin_count || 0,
    armoured_count: tripData.armoured_count || 0,
    assigned_vehicle_ids: tripData.assigned_vehicle_ids || [],
  };

  return trip;
}

// Helper function to validate that a status string is a valid TripStatus
export function validateTripStatus(status: string): TripStatus {
  const validStatuses: TripStatus[] = [
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (validStatuses.includes(status as TripStatus)) {
    return status as TripStatus;
  }

  return "scheduled"; // Default fallback
}

// Determine how many vehicles are required vs assigned for a trip
export function vehicleAssignmentStatus(trip: DisplayTrip) {
  const totalNeeded = (trip.soft_skin_count || 0) + (trip.armoured_count || 0);
  const totalAssigned = trip.assigned_vehicle_ids?.length || 0;

  if (totalAssigned === 0)
    return { state: "none" as const, totalNeeded, totalAssigned };
  if (totalAssigned < totalNeeded)
    return { state: "partial" as const, totalNeeded, totalAssigned };
  return { state: "full" as const, totalNeeded, totalAssigned };
}
