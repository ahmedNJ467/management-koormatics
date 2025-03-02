
import { TripStatus, TripType, DisplayTrip, ServiceType } from "@/lib/types";

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

// Helper interface to provide flexibility when working with backend data
export interface TripData {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  time?: string; 
  return_time?: string;
  start_time?: string;
  end_time?: string;
  service_type?: ServiceType;
  type?: TripType;
  status?: TripStatus;
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_instructions?: string;
  is_recurring?: boolean;
}
