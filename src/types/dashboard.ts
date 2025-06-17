
export interface ActivityItemProps {
  id: string;
  title: string;
  timestamp: string;
  type: 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract' | 'default';
  icon: string;
  related_id?: string; // Add this to track the actual related entity ID
}

export interface StatCardProps {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface TripItemProps {
  id: string;
  client: string;
  destination: string;
  date: string;
  driver: string;
}

export interface CostsBreakdownProps {
  maintenance: {
    total: number;
    service: number;
    repairs: number;
  };
  fuel: {
    total: number;
    diesel: number;
    petrol: number;
  };
}
