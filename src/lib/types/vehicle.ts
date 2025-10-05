export type VehicleStatus = "active" | "in_service" | "inactive";
export type VehicleType = "armoured" | "soft_skin";
export type FuelType = "petrol" | "diesel";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  type: VehicleType;
  status: VehicleStatus;
  fuel_type?: FuelType;
  year?: number;
  color?: string;
  vin?: string;
  insurance_expiry?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  images?: { id: string; url: string; created_at: string }[];
  // Escort assignment fields
  is_escort_assigned?: boolean;
  escort_trip_id?: string;
  escort_assigned_at?: string;
}
