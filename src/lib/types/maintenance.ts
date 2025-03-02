
import { Vehicle } from './vehicle';

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
