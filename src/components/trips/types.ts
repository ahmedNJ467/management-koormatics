
import { TripStatus, DisplayTrip } from "@/lib/types";

export type TripServiceType = 
  | 'airport_pickup'
  | 'airport_dropoff'
  | 'round_trip'
  | 'security_escort'
  | 'one_way'
  | 'full_day_hire';

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

export interface RecurrenceDetails {
  start_date: string;
  end_date: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  occurrences: number;
}

export interface FlightDetails {
  flight_number: string;
  airline: string;
  terminal?: string;
}

export interface TripFormData {
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  time: string;
  return_time?: string;
  service_type: TripServiceType;
  status: TripStatus;
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  is_recurring: boolean;
  recurrence_details?: RecurrenceDetails;
  flight_details?: FlightDetails;
  special_notes?: string;
}
