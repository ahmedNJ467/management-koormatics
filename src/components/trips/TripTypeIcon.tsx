
import { TripType } from "@/lib/types/trip";
import { Plane, ArrowRight, Clock, Calendar, Car, Shield } from "lucide-react";

interface TripTypeIconProps {
  type: TripType;
}

export function TripTypeIcon({ type }: TripTypeIconProps) {
  switch (type) {
    case "airport_pickup":
    case "airport_dropoff":
      return <Plane className="h-4 w-4" />;
    case "other":
      return <ArrowRight className="h-4 w-4" />;
    case "hourly":
      return <Clock className="h-4 w-4" />;
    case "full_day":
      return <Calendar className="h-4 w-4" />;
    case "multi_day":
      return <Calendar className="h-4 w-4" />;
    case "security_escort":
      return <Shield className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4" />;
  }
}
