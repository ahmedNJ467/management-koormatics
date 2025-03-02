
import { TripType, DbServiceType } from "@/lib/types/trip";

// Map UI service types to database service_type values
// Making sure all TripType values are included
export const serviceTypeMap: Record<string, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "round_trip",
  "security_escort": "security_escort",
  "one_way": "one_way_transfer",
  "full_day_hire": "full_day",
  "hourly": "hourly",
  "multi_day": "multi_day",
  "other": "other"
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
