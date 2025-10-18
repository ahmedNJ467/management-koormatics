import { Vehicle } from "./vehicle";

export type FuelType = "petrol" | "diesel";

// Tank-related types
export interface TankFill {
  id: string;
  fill_date: string;
  amount: number;
  cost_per_liter?: number;
  total_cost?: number;
  supplier?: string;
  notes?: string;
  tank_fuel_type?: string;
}

export interface Tank {
  id: string;
  fuel_type: FuelType;
  capacity?: number;
  current_level?: number;
}

export interface TankStats {
  currentLevel: number;
  lastFillDate?: string;
  lastFillAmount?: number;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  date: string;
  fuel_type: FuelType;
  volume: number;
  price_per_liter: number;
  cost: number;
  previous_mileage: number;
  current_mileage: number;
  mileage: number;
  notes?: string;
  fuel_management_id?: string;
  created_at?: string;
  updated_at?: string;
}
