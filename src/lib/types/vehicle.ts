
export type VehicleStatus = 'active' | 'in_service' | 'inactive';
export type VehicleType = 'armoured' | 'soft_skin';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  type: VehicleType;
  status: VehicleStatus;
  year?: number;
  color?: string;
  vin?: string;
  insurance_expiry?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  vehicle_images?: { image_url: string }[];
}
