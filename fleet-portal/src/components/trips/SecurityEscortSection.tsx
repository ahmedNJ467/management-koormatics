import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisplayTrip } from "@/lib/types/trip";
import {
  Shield,
  AlertTriangle,
  Car,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { useTripsData } from "@/hooks/use-trips-data";

interface SecurityEscortSectionProps {
  trip: DisplayTrip;
}

export function SecurityEscortSection({ trip }: SecurityEscortSectionProps) {
  const { vehicles = [] } = useTripsData();

  if (!trip.has_security_escort) {
    return null;
  }

  const escortVehicleIds = trip.escort_vehicle_ids || [];
  const escortVehicles = escortVehicleIds
    .map((id) => vehicles.find((vehicle) => vehicle.id === id))
    .filter(Boolean);

  const getStatusBadge = () => {
    switch (trip.escort_status) {
      case "fully_assigned":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Fully Assigned
          </Badge>
        );
      case "partially_assigned":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Clock className="h-3 w-3 mr-1" />
            Partially Assigned
          </Badge>
        );
      case "not_assigned":
      default:
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Not Assigned
          </Badge>
        );
    }
  };

  return (
    <Card className="border-red-600/50 dark:border-red-500/50 overflow-hidden shadow-md bg-red-950/20">
      <CardHeader className="pb-2 bg-red-950/40 border-b border-red-600/50">
        <CardTitle className="text-md flex items-center justify-between text-red-100">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-red-400" />
            Security Escort Required
            <Badge variant="destructive" className="ml-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              High Security
            </Badge>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Escort Requirements */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-100">
              Escort Vehicles Required:
            </span>
            <Badge variant="outline" className="border-red-600 text-red-200">
              {trip.escort_count || 1} vehicle
              {(trip.escort_count || 1) > 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Assigned Escorts */}
          {escortVehicles.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-red-100">
                Assigned Escort Vehicles:
              </span>
              <div className="space-y-2">
                {escortVehicles.map((vehicle, index) => (
                  <div
                    key={vehicle?.id || index}
                    className="flex items-center gap-2 p-2 bg-red-950/60 rounded border border-red-600/30"
                  >
                    <Car className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-100">
                      Escort {index + 1}: {vehicle?.make} {vehicle?.model} (
                      {vehicle?.registration})
                    </span>
                    {vehicle?.type && (
                      <Badge
                        variant={
                          vehicle.type === "armoured" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {vehicle.type === "armoured" ? "Armoured" : "Soft Skin"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Status */}
          {trip.escort_assigned_at && (
            <div className="text-xs text-red-300 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Escorts assigned on{" "}
              {new Date(trip.escort_assigned_at).toLocaleDateString()} at{" "}
              {new Date(trip.escort_assigned_at).toLocaleTimeString()}
            </div>
          )}

          {/* Warning Message */}
          <div className="text-red-600 dark:text-red-400 text-xs p-2 bg-red-950/40 rounded border border-red-600/30">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Escort vehicles must be assigned and coordinated before trip
            departure for security protocols.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
