
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
