
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceType = 'airport_pickup' | 'airport_dropoff' | 'full_day' | 'one_way_transfer' | 'round_trip' | 'security_escort';

export interface TripMessage {
  id: string;
  trip_id: string;
  sender_type: 'admin' | 'driver' | 'client';
  sender_name: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  attachment_url?: string;
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
  driver_rating?: number;
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
  service_type: ServiceType;
  status: TripStatus;
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_instructions?: string;
  is_recurring?: boolean;
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
  special_notes?: string;
  ui_service_type?: string; // Added to store the UI service type corresponding to database type
}

export const serviceTypeDisplayMap: Record<ServiceType, string> = {
  'airport_pickup': 'Airport Pickup',
  'airport_dropoff': 'Airport Dropoff',
  'full_day': 'Full Day',
  'one_way_transfer': 'One Way Transfer',
  'round_trip': 'Round Trip',
  'security_escort': 'Security Escort'
};
