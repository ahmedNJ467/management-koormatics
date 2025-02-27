
export type DriverStatus = 'active' | 'inactive' | 'on_leave';

export interface Driver {
  id: string;
  name: string;
  contact: string;
  license_number: string;
  license_type: string;
  license_expiry: string;
  status: DriverStatus;
  avatar_url?: string;
  document_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type VehicleType = 'armoured' | 'soft_skin';
export type VehicleStatus = 'active' | 'in_service' | 'inactive';

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  registration: string;
  year?: number;
  color?: string;
  vin?: string;
  insurance_expiry?: string;
  status: VehicleStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  vehicle_images?: VehicleImage[];
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  vehicle_id: string;
  date: string;
  description: string;
  cost: number;
  next_scheduled?: string;
  status: MaintenanceStatus;
  notes?: string;
  service_provider?: string;
  created_at?: string;
  updated_at?: string;
  vehicle?: Vehicle;
}

export type FuelType = 'petrol' | 'diesel';

export interface FuelLog {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  date: string;
  fuel_type: FuelType;
  volume: number;
  cost: number;
  mileage: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Quotation {
  id: string;
  date: string;
  client_id: string;
  status: QuotationStatus;
  total_amount: number;
  valid_until: string;
  notes?: string;
  items: QuotationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DisplayQuotation extends Quotation {
  client_name: string;
  client_email?: string;
}

export interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  description?: string;
  website?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Trip types and interfaces - Updated to match database schema exactly
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day';

// UI Service Type for form selection
export type UIServiceType = 
  | "airport_pickup"
  | "airport_dropoff"
  | "one_way"
  | "round_trip"
  | "full_day_hire"
  | "security_escort";

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
}

export interface DisplayTrip extends Trip {
  client_name: string;
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // These fields are for UI display only and not stored directly in the database
  time?: string; // For displaying formatted start_time
  return_time?: string; // For displaying formatted end_time
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_notes?: string;
  is_recurring?: boolean; // Added for UI display purposes
  ui_service_type?: UIServiceType; // Added to store the UI service type corresponding to database type
}
