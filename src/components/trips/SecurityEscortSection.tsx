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
  const requiredCount = Math.max(trip.escort_count || 0, 0);
  const assignedCount = escortVehicles.length;
  const computedStatus =
    assignedCount >= requiredCount && requiredCount > 0
      ? "fully_assigned"
      : assignedCount > 0
      ? "partially_assigned"
      : trip.escort_status || "not_assigned";

  const getStatusBadge = () => {
    switch (computedStatus) {
      case "fully_assigned":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Fully Assigned
          </Badge>
        );
      case "partially_assigned":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300"
          >
            <Clock className="h-3 w-3 mr-1" />
            Partially Assigned
          </Badge>
        );
      case "not_assigned":
      default:
        return (
          <Badge
            variant="destructive"
            className="border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:border-destructive/40 dark:bg-destructive/20 dark:hover:bg-destructive/25"
          >
            <X className="h-3 w-3 mr-1" />
            Not Assigned
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border border-destructive/20 bg-card dark:border-destructive/30 dark:bg-card/80">
      <CardHeader className="pb-2 border-b border-destructive/20 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/15">
        <CardTitle className="text-md flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            <span>Security Escort Required</span>
            <Badge
              variant="destructive"
              className="ml-2 text-xs border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20 dark:border-destructive/40 dark:bg-destructive/25 dark:hover:bg-destructive/30"
            >
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
            <span className="text-sm font-medium text-foreground">
              Escort Vehicles Required:
            </span>
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/5 text-foreground dark:border-destructive/40 dark:bg-destructive/15"
            >
              {requiredCount || 1} vehicle
              {(requiredCount || 1) > 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Assigned Escorts */}
          {escortVehicles.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Assigned Escort Vehicles:
              </span>
              <div className="space-y-2">
                {escortVehicles.map((vehicle, index) => (
                  <div
                    key={vehicle?.id || index}
                    className="flex items-center gap-2 rounded border border-destructive/20 bg-muted/60 p-2 dark:border-destructive/30 dark:bg-muted/50"
                  >
                    <Car className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-foreground">
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Escorts assigned on{" "}
              {new Date(trip.escort_assigned_at).toLocaleDateString()} at{" "}
              {new Date(trip.escort_assigned_at).toLocaleTimeString()}
            </div>
          )}

          {/* Warning Message */}
          <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive dark:border-destructive/40 dark:bg-destructive/20">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            Escort vehicles must be assigned and coordinated before trip
            departure for security protocols.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
