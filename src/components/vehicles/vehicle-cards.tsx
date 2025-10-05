import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { formatVehicleId } from "@/lib/utils";

interface VehicleCardsProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const VehicleCards = memo(
  ({ vehicles, onVehicleClick }: VehicleCardsProps) => {
    const handleVehicleClick = useCallback(
      (vehicle: Vehicle) => {
        onVehicleClick(vehicle);
      },
      [onVehicleClick]
    );

    const getVehicleStatus = (vehicle: Vehicle) => {
      if (vehicle.status === "in_service") {
        return {
          text: "In Service",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      }

      if (vehicle.status === "inactive") {
        return {
          text: "Inactive",
          color: "bg-gray-50 text-gray-700 border-gray-200",
        };
      }

      // Default to active
      return {
        text: "Active",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    };

    const isInsuranceExpiringSoon = (expiryDate: string | null) => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isInsuranceExpired = (expiryDate: string | null) => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      return expiry < now;
    };

    if (!vehicles || !Array.isArray(vehicles)) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          No vehicles data available
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {vehicles
          .map((vehicle) => {
            if (!vehicle || typeof vehicle !== "object") {
              console.warn("Invalid vehicle object:", vehicle);
              return null;
            }

            const hasImage =
              vehicle.images &&
              Array.isArray(vehicle.images) &&
              vehicle.images.length > 0;
            const insuranceExpiringSoon = isInsuranceExpiringSoon(
              vehicle.insurance_expiry || null
            );
            const insuranceExpired = isInsuranceExpired(
              vehicle.insurance_expiry || null
            );

            const statusInfo = getVehicleStatus(vehicle);

            return (
              <Card
                key={vehicle.id || Math.random()}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 border"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-muted-foreground">
                      {formatVehicleId(vehicle.id)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusInfo.color}`}
                    >
                      {statusInfo.text}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Vehicle Image */}
                  <div className="relative aspect-video bg-gray-50 rounded-lg overflow-hidden border flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={vehicle.images[0]?.url || ""}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        hasImage ? "hidden" : ""
                      }`}
                    >
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    {/* Insurance Warning */}
                    {(insuranceExpiringSoon || insuranceExpired) && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-xs">
                          {insuranceExpired ? "Expired" : "Expiring"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium text-base">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {vehicle.registration}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <span className="ml-1">{vehicle.year || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-1 capitalize">
                          {vehicle.type || "N/A"}
                        </span>
                      </div>
                    </div>

                    {vehicle.insurance_expiry && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Insurance expires:{" "}
                        </span>
                        <span
                          className={
                            insuranceExpired
                              ? "text-red-600"
                              : insuranceExpiringSoon
                              ? "text-orange-600"
                              : ""
                          }
                        >
                          {new Date(
                            vehicle.insurance_expiry
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
          .filter(Boolean)}
      </div>
    );
  }
);

VehicleCards.displayName = "VehicleCards";
