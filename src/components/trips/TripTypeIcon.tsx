
import { TripType } from "@/lib/types/trip";
import { Plane, ArrowRight, Clock, Calendar, Car, Shield, Repeat } from "lucide-react";

interface TripTypeIconProps {
  type: TripType | string | undefined | null;
  className?: string;
}

export function TripTypeIcon({ type, className }: TripTypeIconProps) {
  // Enhanced safety check for undefined/null type
  if (!type || typeof type !== 'string') {
    console.warn('TripTypeIcon: Invalid type provided', type);
    return <Car className={className || "h-4 w-4"} />;
  }

  // Convert to string and check for valid values
  const safeType = String(type).toLowerCase();

  switch (safeType) {
    case "airport_pickup":
      return <Plane className={className || "h-4 w-4"} />;
    case "airport_dropoff":
      return <Plane className={className || "h-4 w-4"} />;
    case "other":
      return <ArrowRight className={className || "h-4 w-4"} />;
    case "hourly":
      return <Clock className={className || "h-4 w-4"} />;
    case "full_day":
      return <Calendar className={className || "h-4 w-4"} />;
    case "multi_day":
      return <Calendar className={className || "h-4 w-4"} />;
    case "one_way_transfer":
      return <ArrowRight className={className || "h-4 w-4"} />;
    case "round_trip":
      return <Repeat className={className || "h-4 w-4"} />;
    case "security_escort":
      return <Shield className={className || "h-4 w-4"} />;
    default:
      return <Car className={className || "h-4 w-4"} />;
  }
}
