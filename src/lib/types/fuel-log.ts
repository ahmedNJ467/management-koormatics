export type FuelType = "petrol" | "diesel" | "cng";

export interface FuelLog {
  id: string;
  vehicle_id: string;
  date: string;
  fuel_type: FuelType;
  volume: number;
  cost: number;
  previous_mileage: number;
  current_mileage: number;
  mileage: number;
  notes?: string;
  filled_by?: string;
  created_at?: string;
  updated_at?: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
}

export interface FuelTank {
  id: string;
  name: string;
  fuel_type: "petrol" | "diesel";
  capacity: number;
  created_at?: string;
}

export interface TankFill {
  id: string;
  tank_id: string;
  fill_date: string;
  amount: number;
  cost_per_liter?: number;
  total_cost?: number;
  supplier?: string;
  notes?: string;
  created_at?: string;
}
