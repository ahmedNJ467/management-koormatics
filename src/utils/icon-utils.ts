
import { 
  Car, Users, Wrench, Fuel, DollarSign, CreditCard, Wallet,
  BarChart2, Activity, PieChart, Calendar, Bell
} from "lucide-react";

type IconType = typeof Car;

export const getIconComponent = (iconName: string): IconType | null => {
  const iconMap: Record<string, IconType> = {
    Car,
    Users,
    Wrench,
    Fuel,
    DollarSign,
    CreditCard,
    Wallet,
    BarChart2,
    Activity,
    PieChart,
    Calendar,
    Bell
  };

  return iconMap[iconName] || null;
};
