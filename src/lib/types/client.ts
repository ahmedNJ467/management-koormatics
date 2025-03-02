
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
  archived?: boolean;
  is_archived?: boolean; // Including both property names for compatibility
  has_active_contract?: boolean;
}
