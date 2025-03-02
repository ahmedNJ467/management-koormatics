
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day';
export type ServiceType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day'; // Alias for TripType to match database

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
  
  // Extra fields to match database
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_instructions?: string;
  is_recurring?: boolean;
  service_type?: ServiceType; // Database uses service_type instead of type in some places
  time?: string; // DB has time sometimes instead of start_time
  return_time?: string; // Alias for end_time
}

export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // These fields are for UI display only and not stored directly in the database
  special_notes?: string;
  ui_service_type?: string; // Added to store the UI service type corresponding to database type
}

// Mapping of trip types to UI-friendly display names
export const tripTypeDisplayMap: Record<TripType, string> = {
  'airport_pickup': 'Airport Pickup',
  'airport_dropoff': 'Airport Dropoff',
  'other': 'Other Service',
  'hourly': 'Hourly Service',
  'full_day': 'Full Day',
  'multi_day': 'Multi Day'
};

// Helper function to map between service_type and type
export const mapServiceTypeToTripType = (serviceType: ServiceType): TripType => {
  // They're the same values but might have different type constraints
  return serviceType as TripType;
};

export const mapTripTypeToServiceType = (tripType: TripType): ServiceType => {
  // They're the same values but might have different type constraints
  return tripType as ServiceType;
};
