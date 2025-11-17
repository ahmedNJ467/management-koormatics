
export type DriverStatus = 'active' | 'inactive' | 'on_leave';

export interface Driver {
  id: string;
  name: string;
  contact: string;
  location?: string;
  license_number: string;
  license_type: string;
  license_expiry: string;
  status: DriverStatus;
  is_vip?: boolean;
  avatar_url?: string;
  document_url?: string;
  airport_id_url?: string;
  created_at?: string;
  updated_at?: string;
}
