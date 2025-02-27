

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

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  date: string;
  due_date: string;
  client_id: string;
  status: InvoiceStatus;
  total_amount: number;
  paid_amount?: number;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  items: InvoiceItem[];
  quotation_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisplayInvoice extends Invoice {
  client_name: string;
  client_email?: string;
}

