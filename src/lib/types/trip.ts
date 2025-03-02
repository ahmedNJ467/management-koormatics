
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day' | 'one_way_transfer' | 'round_trip' | 'security_escort';

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
  // Add database field mappings
  time?: string;            // Corresponds to start_time
  return_time?: string;     // Corresponds to end_time
  service_type?: string;    // Corresponds to type
  special_instructions?: string; // Corresponds to notes
  airline?: string;
  flight_number?: string;
  terminal?: string;
  is_recurring?: boolean;
}

export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // Additional UI display fields
  special_notes?: string;  // Alternative to notes/special_instructions
  ui_service_type?: string; // UI-friendly display of type
}

// Mapping of trip types to UI-friendly display names
export const tripTypeDisplayMap: Record<TripType, string> = {
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

// Utility function to convert database fields to Trip interface
export const mapDatabaseFieldsToTrip = (dbTrip: any): DisplayTrip => {
  return {
    ...dbTrip,
    // Map database fields to Trip interface
    type: dbTrip.service_type || 'other',
    status: dbTrip.status || 'scheduled',
    start_time: dbTrip.time,
    end_time: dbTrip.return_time,
    notes: dbTrip.special_instructions,
    // Additional display fields
    client_name: dbTrip.clients?.name || "Unknown Client",
    client_type: dbTrip.clients?.type,
    vehicle_details: dbTrip.vehicles ? 
      `${dbTrip.vehicles.make || ""} ${dbTrip.vehicles.model || ""} (${dbTrip.vehicles.registration || ""})` : 
      "Vehicle details not available",
    driver_name: dbTrip.drivers?.name || "Driver not assigned",
    driver_avatar: dbTrip.drivers?.avatar_url,
    driver_contact: dbTrip.drivers?.contact,
  };
};

// Utility function to convert Trip interface to database fields
export const mapTripToDatabaseFields = (trip: Partial<Trip>): any => {
  // Create a new object with the database field names
  const dbTrip: any = {
    ...trip,
    // Map Trip interface fields to database fields
    service_type: trip.type,
    time: trip.start_time,
    return_time: trip.end_time,
    special_instructions: trip.notes,
  };
  
  // Remove Trip interface fields that don't exist in the database
  delete dbTrip.type;
  delete dbTrip.start_time;
  delete dbTrip.end_time;
  delete dbTrip.notes;
  
  return dbTrip;
};
