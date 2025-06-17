
export interface ActivityItemProps {
  id: string;
  title: string;
  timestamp: string;
  type: 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract' | 'default';
  icon: string;
  related_id?: string; // Add this to track the actual related entity ID
}
