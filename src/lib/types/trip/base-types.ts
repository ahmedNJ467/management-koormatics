export type TripStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type TripType =
  | "airport_pickup"
  | "airport_dropoff"
  | "half_day"
  | "full_day"
  | "one_way_transfer"
  | "round_trip";

// This is what the database accepts for the service_type column
export type DbServiceType =
  | "airport_pickup"
  | "airport_dropoff"
  | "full_day"
  | "half_day"
  | "one_way_transfer"
  | "round_trip";

export const tripTypeDisplayMap: Record<string, string> = {
  airport_pickup: "Airport Pickup",
  airport_dropoff: "Airport Dropoff",
  half_day: "Half Day",
  full_day: "Full Day",
  one_way_transfer: "One Way Transfer",
  round_trip: "Round Trip",
  security_escort: "Security Escort",
};

// Add the serviceTypeOptions export for form component
export const serviceTypeOptions = [
  "airport_pickup",
  "airport_dropoff",
  "half_day",
  "full_day",
  "one_way_transfer",
  "round_trip",
];
