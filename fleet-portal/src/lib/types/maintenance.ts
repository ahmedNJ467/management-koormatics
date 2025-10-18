
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  vehicle_id: string;
  date: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  next_scheduled?: string;
  notes?: string;
  service_provider?: string;
  created_at?: string;
  updated_at?: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    registration: string;
  };
  spare_parts?: Array<{
    id: string;
    quantity: number;
  }>;
}
