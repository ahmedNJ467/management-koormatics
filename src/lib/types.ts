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
