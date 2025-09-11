
import { Calendar, Clock, User, Car, Building, Activity, Fuel, FileCheck } from "lucide-react";

interface ActivityIconProps {
  type: string;
}

export const ActivityIcon = ({ type }: ActivityIconProps) => {
  const getActivityIcon = (type: string) => {
    if (!type || typeof type !== 'string') {
      return <Activity className="h-5 w-5 text-gray-500" />;
    }

    switch (type.toLowerCase()) {
      case 'trip':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-indigo-500" />;
      case 'driver':
        return <User className="h-5 w-5 text-green-500" />;
      case 'vehicle':
        return <Car className="h-5 w-5 text-amber-500" />;
      case 'fuel':
        return <Fuel className="h-5 w-5 text-red-500" />;
      case 'contract':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case 'client':
        return <Building className="h-5 w-5 text-pink-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="text-blue-400 mt-1">
      {getActivityIcon(type)}
    </div>
  );
};
