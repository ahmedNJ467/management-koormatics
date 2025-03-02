export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'one_way_transfer' | 'round_trip' | 'full_day' | 'security_escort' | 'hourly' | 'multi_day' | 'other';

export interface TripMessage {
  id: string;
  trip_id: string;
  sender_type: 'admin' | 'driver' | 'client';
  sender_name: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TripAssignment {
  id: string;
  trip_id: string;
  driver_id: string;
  driver_name?: string;
  driver_avatar?: string;
  assigned_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Trip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: TripType;
  status: TripStatus;
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // These fields are for UI display only and not stored directly in the database
  time?: string; // For displaying formatted start_time
  return_time?: string; // For displaying formatted end_time
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_notes?: string;
  is_recurring?: boolean; // Added for UI display purposes
  ui_service_type?: string; // Added to store the UI service type corresponding to database type
}

// Mapping of trip types to UI-friendly display names
export const tripTypeDisplayMap: Record<TripType, string> = {
  'airport_pickup': 'Airport Pickup',
  'airport_dropoff': 'Airport Dropoff',
  'one_way_transfer': 'One Way Transfer',
  'round_trip': 'Round Trip',
  'full_day': 'Full Day Hire',
  'security_escort': 'Security Escort',
  'hourly': 'Hourly Service',
  'multi_day': 'Multi Day',
  'other': 'Other Service'
};
