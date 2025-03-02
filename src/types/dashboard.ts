
export interface StatCardProps {
  name: string;
  value: string;
  icon: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface TripItemProps {
  id: number;
  client: string;
  destination: string;
  date: string;
  driver: string;
}

export interface AlertItemProps {
  id: number;
  title: string;
  priority: "high" | "medium" | "low";
  date: string;
}

export interface CostsBreakdownProps {
  maintenance: {
    preventive: number;
    repairs: number;
    total: number;
  };
  fuel: {
    diesel: number;
    petrol: number;
    total: number;
  };
}
