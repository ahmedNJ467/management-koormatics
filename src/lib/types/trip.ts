
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

// This interface maps to the database schema directly
export interface DbTrip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  time?: string;             // start_time in application
  return_time?: string;      // end_time in application
  service_type?: TripType;   // type in application
  status?: TripStatus;       // Not always in database, defaults to 'scheduled'
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  special_instructions?: string; // notes in application
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  airline?: string;
  flight_number?: string;
  terminal?: string;
  is_recurring?: boolean;
}

// This is the application's internal representation of a trip
export interface Trip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  start_time?: string;        // time in database
  end_time?: string;          // return_time in database
  type: TripType;             // service_type in database
  status: TripStatus;         // May need to be derived from database 
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string;             // special_instructions in database
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields from database
  time?: string;              // Alias for start_time
  return_time?: string;       // Alias for end_time
  service_type?: string;      // Alias for type
  special_instructions?: string; // Alias for notes
  airline?: string;
  flight_number?: string;
  terminal?: string;
  is_recurring?: boolean;
}

// Extended trip with UI display information
export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // Additional UI display fields
  special_notes?: string;     // Alternative to notes/special_instructions
  ui_service_type?: string;   // UI-friendly display of type
  flight_info?: string;       // Formatted flight information
  display_type?: string;      // Formatted display of trip type
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
  // Ensure all required properties are present with defaults
  return {
    ...dbTrip,
    // Map database fields to Trip interface properties
    type: dbTrip.service_type || dbTrip.type || 'other',
    status: dbTrip.status || 'scheduled',
    start_time: dbTrip.time || dbTrip.start_time,
    end_time: dbTrip.return_time || dbTrip.end_time,
    notes: dbTrip.special_instructions || dbTrip.notes,
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
    display_type: dbTrip.display_type || (dbTrip.service_type && tripTypeDisplayMap[dbTrip.service_type as TripType]) || 
                 (dbTrip.type && tripTypeDisplayMap[dbTrip.type as TripType]) || 'Other',
  };
};

// Utility function to convert Trip interface to database fields
export const mapTripToDatabaseFields = (trip: Partial<Trip>): Partial<DbTrip> => {
  // Create a new object with the database field names
  const dbTrip: Partial<DbTrip> = {
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

// Helper function to extract flight information from notes
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
