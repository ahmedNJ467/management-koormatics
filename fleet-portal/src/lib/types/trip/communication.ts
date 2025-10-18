
import { TripStatus } from "./base-types";

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
