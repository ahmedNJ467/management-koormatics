
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day' | 'one_way_transfer' | 'round_trip' | 'security_escort';

// This is what the database accepts for the service_type column
export type DbServiceType = 'airport_pickup' | 'airport_dropoff' | 'full_day' | 'one_way_transfer' | 'round_trip' | 'security_escort';

export const tripTypeDisplayMap: Record<string, string> = {
  'airport_pickup': 'Airport Pickup',
  'airport_dropoff': 'Airport Dropoff',
  'other': 'Other Service',
  'hourly': 'Hourly Service',
  'full_day': 'Full Day',
  'multi_day': 'Multi Day',
  'one_way_transfer': 'One Way Transfer',
  'round_trip': 'Round Trip',
  'security_escort': 'Security Escort'
};
