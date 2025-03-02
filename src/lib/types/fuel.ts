
import { Vehicle } from './vehicle';

export type FuelType = 'petrol' | 'diesel' | 'cng';

export interface FuelLog {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  date: string;
  fuel_type: FuelType;
  volume: number;
  cost: number;
  previous_mileage: number;
  current_mileage: number;
  mileage: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
