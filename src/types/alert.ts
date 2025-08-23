
export interface Alert {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
  created_at: string;
  updated_at: string;
  resolved: boolean;
  type: 'maintenance' | 'driver' | 'fuel' | 'vehicle' | 'trip' | 'contract';
  description?: string;
  related_id?: string;
  related_type?: string;
}

export interface Activity {
  id: string;
  title: string;
  timestamp: string;
  type: 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract';
  related_id?: string;
  created_at: string;
  updated_at: string;
}
