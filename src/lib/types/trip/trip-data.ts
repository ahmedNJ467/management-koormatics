
import { TripStatus, TripType, DbServiceType } from "./base-types";

export interface DbTrip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  time?: string;             // start_time in application
  return_time?: string;      // end_time in application
  service_type?: DbServiceType;   // type in application
  status?: TripStatus;       // Not in database, derived from special_instructions
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  special_instructions?: string; // notes in application, also contains status information
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  airline?: string;
  flight_number?: string;
  terminal?: string;
  is_recurring?: boolean;
}

export interface Trip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  start_time?: string;        // time in database
  end_time?: string;          // return_time in database
  type: TripType;             // service_type in database
  status: TripStatus;         // Derived from special_instructions
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
  service_type?: DbServiceType;      // Alias for type
  special_instructions?: string; // Alias for notes
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
  special_notes?: string;     // Alternative to notes/special_instructions
  ui_service_type?: string;   // UI-friendly display of type
  flight_info?: string;       // Formatted flight information
  display_type?: string;      // Formatted display of trip type
  passengers?: string[];      // Array of passenger names for organization clients
}
