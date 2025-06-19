import { memo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Shield,
  Car as CarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { Vehicle } from "@/lib/types";
import { formatVehicleId } from "@/lib/utils";

interface VehicleTableProps {
  vehicles: (Vehicle & { vehicle_images: { image_url: string }[] })[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const VehicleTable = memo(
  ({ vehicles, onVehicleClick }: VehicleTableProps) => {
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

    const safeReplace = (value: any, defaultValue: string = "N/A"): string => {
      if (
        !value ||
        typeof value !== "string" ||
        value === "undefined" ||
        value === "null"
      ) {
        return defaultValue;
      }
      try {
        return value.replace("_", " ");
      } catch (error) {
        console.warn("Error in safeReplace:", error, "value:", value);
        return defaultValue;
      }
    };

    const safeString = (value: any, defaultValue: string = ""): string => {
      if (
        value === null ||
        value === undefined ||
        value === "undefined" ||
        value === "null"
      ) {
        return defaultValue;
      }
      try {
        return String(value);
      } catch (error) {
        console.warn("Error in safeString:", error, "value:", value);
        return defaultValue;
      }
    };

    if (!vehicles || !Array.isArray(vehicles)) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No vehicles data available
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Insurance</TableHead>
            <TableHead>VIN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles
            .map((vehicle) => {
              if (!vehicle || typeof vehicle !== "object") {
                console.warn("Invalid vehicle object:", vehicle);
                return null;
              }

              const insuranceExpiringSoon = isInsuranceExpiringSoon(
                vehicle.insurance_expiry
              );
              const insuranceExpired = isInsuranceExpired(
                vehicle.insurance_expiry
              );

              return (
                <TableRow
                  key={vehicle.id || Math.random()}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {vehicle.vehicle_images &&
                        Array.isArray(vehicle.vehicle_images) &&
                        vehicle.vehicle_images.length > 0 ? (
                          <img
                            src={vehicle.vehicle_images[0]?.image_url || ""}
                            alt={`${safeString(
                              vehicle.make,
                              "Vehicle"
                            )} ${safeString(vehicle.model)}`}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {safeString(vehicle.make, "Unknown")}{" "}
                          {safeString(vehicle.model, "Model")}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {formatVehicleId(safeString(vehicle.id, ""))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(vehicle.type)}
                      <span className="capitalize">
                        {safeReplace(vehicle.type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(vehicle.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(vehicle.status)}`}
                      >
                        {safeReplace(vehicle.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {safeString(vehicle.registration, "N/A")}
                  </TableCell>
                  <TableCell>{vehicle.year || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vehicle.insurance_expiry ? (
                        <>
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span
                            className={`text-sm ${
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
                          {(insuranceExpiringSoon || insuranceExpired) && (
                            <Badge variant="destructive" className="text-xs">
                              {insuranceExpired ? "Expired" : "Expiring"}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {safeString(vehicle.vin, "N/A")}
                  </TableCell>
                </TableRow>
              );
            })
            .filter(Boolean)}
        </TableBody>
      </Table>
    );
  }
);

VehicleTable.displayName = "VehicleTable";
