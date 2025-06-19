import { TripStatus, TripType, DbServiceType } from "./base-types";

export interface DbTrip {
  id: string;
  client_id: string;
  vehicle_id?: string;
  driver_id?: string;
  date: string;
  time?: string; // scheduled pickup time
  return_time?: string; // scheduled return time
  actual_pickup_time?: string; // actual pickup time (new field)
  actual_dropoff_time?: string; // actual dropoff time (new field)
  service_type?: DbServiceType; // type in application
  status?: TripStatus; // Now stored directly in the database
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string; // Now only stores actual notes, not status or flight info
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  airline?: string; // Now stored directly in the database
  flight_number?: string; // Now stored directly in the database
  terminal?: string; // Now stored directly in the database
  is_recurring?: boolean;
  passengers?: string[]; // Array of passenger names for organization clients
  log_sheet_url?: string;
  vehicle_type?: "armoured" | "soft_skin";
  passport_documents?: { name: string; url: string; passenger_name: string }[];
  invitation_documents?: {
    name: string;
    url: string;
    passenger_name: string;
  }[];
}

export interface Trip {
  id: string;
  client_id: string;
  vehicle_id?: string;
  driver_id?: string;
  date: string;
  start_time?: string; // scheduled pickup time (time in database)
  end_time?: string; // scheduled return time (return_time in database)
  actual_start_time?: string; // actual pickup time (actual_pickup_time in database)
  actual_end_time?: string; // actual dropoff time (actual_dropoff_time in database)
  type: TripType; // service_type in database
  status: TripStatus; // Now comes directly from the status column
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string; // Now only stores actual notes
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields from database
  time?: string; // Alias for start_time (scheduled pickup)
  return_time?: string; // Alias for end_time (scheduled return)
  actual_pickup_time?: string; // Alias for actual_start_time
  actual_dropoff_time?: string; // Alias for actual_end_time
  service_type?: DbServiceType; // Alias for type
  airline?: string; // Direct from database
  flight_number?: string; // Direct from database
  terminal?: string; // Direct from database
  is_recurring?: boolean;
  passengers?: string[]; // Array of passenger names for organization clients
  log_sheet_url?: string;
  vehicle_type?: "armoured" | "soft_skin";
  passport_documents?: { name: string; url: string; passenger_name: string }[];
  invitation_documents?: {
    name: string;
    url: string;
    passenger_name: string;
  }[];
}

export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // Additional UI display fields
  special_notes?: string; // Alternative to notes
  ui_service_type?: string; // UI-friendly display of type
  display_type?: string; // Formatted display of trip type
}
