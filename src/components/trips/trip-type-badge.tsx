
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ServiceType, serviceTypeDisplayMap } from "@/lib/types/trip";

interface TripTypeBadgeProps {
  type: ServiceType;
  className?: string;
}

const TripTypeBadge = ({ type, className }: TripTypeBadgeProps) => {
  const displayName = serviceTypeDisplayMap[type] || type;
  
  const getBadgeColor = () => {
    switch (type) {
      case 'airport_pickup':
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case 'airport_dropoff':
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100";
      case 'one_way_transfer':
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case 'round_trip':
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case 'full_day':
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case 'multi_day':
        return "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100";
      case 'security_escort':
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case 'hourly':
        return "bg-teal-100 text-teal-700 hover:bg-teal-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <Badge 
      className={cn(
        "font-medium rounded-md px-2.5 py-1", 
        getBadgeColor(),
        className
      )}
      variant="outline"
    >
      {displayName}
    </Badge>
  );
};

export default TripTypeBadge;
