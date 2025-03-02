
import { TripStatus, TripType } from "@/lib/types/trip";

export interface TripMessageData {
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

export interface TripAssignmentData {
  id: string;
  trip_id: string;
  driver_id: string;
  assigned_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  drivers?: {
    name?: string;
    avatar_url?: string;
  };
  driver_name?: string;
  driver_avatar?: string;
}

export interface DbTripData {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  time?: string;
  return_time?: string;
  service_type?: TripType;
  status?: string; // Changed from TripStatus to string to match the database schema
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  special_instructions?: string;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  airline?: string;
  flight_number?: string;
  terminal?: string;
  is_recurring?: boolean;
  notes?: string; // Keep notes for backward compatibility
  // Joined data
  clients?: {
    name: string;
    type?: "organization" | "individual";
  };
  vehicles?: {
    make?: string;
    model?: string;
    registration?: string;
  };
  drivers?: {
    name?: string;
    avatar_url?: string;
    contact?: string;
  };
}
