import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Calendar,
  Shield,
  Car as CarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Vehicle } from "@/lib/types";
import { formatVehicleId } from "@/lib/utils";

interface VehicleCardsProps {
  vehicles: (Vehicle & { vehicle_images: { image_url: string }[] })[];
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

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "active":
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case "in_service":
          return <Clock className="h-4 w-4 text-blue-600" />;
        case "inactive":
          return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        default:
          return <Car className="h-4 w-4 text-muted-foreground" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-800 border-green-200";
        case "in_service":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "inactive":
          return "bg-orange-100 text-orange-800 border-orange-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getTypeIcon = (type: string) => {
      return type === "armoured" ? (
        <Shield className="h-4 w-4" />
      ) : (
        <CarIcon className="h-4 w-4" />
      );
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
              vehicle.vehicle_images &&
              Array.isArray(vehicle.vehicle_images) &&
              vehicle.vehicle_images.length > 0;
            const insuranceExpiringSoon = isInsuranceExpiringSoon(
              vehicle.insurance_expiry
            );
            const insuranceExpired = isInsuranceExpired(
              vehicle.insurance_expiry
            );

            return (
              <Card
                key={vehicle.id || Math.random()}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(vehicle.type)}
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatVehicleId(vehicle.id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(vehicle.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(vehicle.status)}`}
                      >
                        {typeof vehicle.status === "string"
                          ? vehicle.status.replace("_", " ")
                          : "N/A"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Vehicle Image */}
                  <div className="relative aspect-video bg-white rounded-t-xl overflow-hidden border border-border shadow-sm flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={vehicle.vehicle_images[0]?.image_url || ""}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-contain rounded-t-xl group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        hasImage ? "hidden" : ""
                      }`}
                    >
                      <Car className="h-12 w-12 text-muted-foreground" />
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
                      <h3 className="font-semibold text-lg leading-tight">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {vehicle.registration}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <span className="ml-1 font-medium">
                          {vehicle.year || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Color:</span>
                        <span className="ml-1 font-medium">
                          {vehicle.color || "N/A"}
                        </span>
                      </div>
                    </div>

                    {vehicle.insurance_expiry && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Insurance:
                        </span>
                        <span
                          className={`font-medium ${
                            insuranceExpired
                              ? "text-red-600"
                              : insuranceExpiringSoon
                              ? "text-orange-600"
                              : ""
                          }`}
                        >
                          {new Date(
                            vehicle.insurance_expiry
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVehicleClick(vehicle);
                      }}
                    >
                      View Details
                    </Button>
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
