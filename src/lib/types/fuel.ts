import { Vehicle } from "./vehicle";

export type FuelType = "petrol" | "diesel";

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
  tank_id?: string;
  created_at?: string;
  updated_at?: string;
}
