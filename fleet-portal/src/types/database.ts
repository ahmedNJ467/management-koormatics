// Database entity types to resolve type mismatches
export interface Tank {
  id: string;
  fuel_type: string;
  capacity: number;
  current_level: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface TankFill {
  id: string;
  fuel_management_id: string;
  fill_date: string;
  amount: number;
  cost_per_liter?: number;
  total_cost?: number;
  supplier: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FuelManagement {
  id: string;
  fuel_type: string;
  capacity: number;
  current_level: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  vehicle_id: string;
  date: string;
  description: string;
  cost: number;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Guard {
  id: string;
  name: string;
  phone: string;
  id_number: string;
  rank: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EscortTeam {
  id: string;
  team_name: string;
  guard_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  client_id: string;
  status: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  date: string;
  due_date: string;
  status: string;
  total_amount: number;
  items: any;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  client_id: string;
  date: string;
  status: string;
  total_amount: number;
  valid_until: string;
  notes?: string;
  items: any;
  created_at: string;
  updated_at: string;
}

export interface LeaseInvoice {
  id: string;
  lease_id: string;
  invoice_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  status: string;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_slug: string;
  created_at: string;
}
