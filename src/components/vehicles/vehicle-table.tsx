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
import { Skeleton } from "@/components/ui/skeleton";
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
import React from "react";

interface VehicleTableProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
  isLoading?: boolean;
  driversById?: Record<string, { name?: string | null; status?: string | null }>;
}

export const VehicleTable = memo(
  ({ vehicles, onVehicleClick, isLoading = false, driversById = {} }: VehicleTableProps) => {
    const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

    const handleVehicleClick = useCallback(
      (vehicle: Vehicle) => {
        onVehicleClick(vehicle);
      },
      [onVehicleClick]
    );

    const handleImageLoad = useCallback((vehicleId: string) => {
      setLoadedImages((prev) => new Set(prev).add(vehicleId));
    }, []);

    const handleImageError = useCallback((vehicleId: string) => {
      setLoadedImages((prev) => {
        const next = new Set(prev);
        next.delete(vehicleId);
        return next;
      });
    }, []);

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

    const getStatusText = (status: string) => {
      switch (status) {
        case "active":
          return "Active";
        case "in_service":
          return "In Service";
        case "inactive":
          return "Inactive";
        default:
          return "Unknown";
      }
    };

    // Icons removed per request; show plain text only for type

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
            <TableHead>Location</TableHead>
            <TableHead>Insurance</TableHead>
            <TableHead>Assigned Driver</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Show skeleton rows while loading
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-24 h-16" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              </TableRow>
            ))
          ) : (
            vehicles
              .map((vehicle) => {
                if (!vehicle || typeof vehicle !== "object") {
                  console.warn("Invalid vehicle object:", vehicle);
                  return null;
                }

                const insuranceExpiringSoon = isInsuranceExpiringSoon(
                  vehicle.insurance_expiry || null
                );
                const insuranceExpired = isInsuranceExpired(
                  vehicle.insurance_expiry || null
                );
                const vehicleId = safeString(vehicle.id, "");
                const imgLoaded = loadedImages.has(vehicleId);

                return (
                  <TableRow
                    key={vehicle.id || Math.random()}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-24 h-16 overflow-hidden">
                          {/* Always show the placeholder; hide only if image is loaded */}
                          <div
                            className={`absolute inset-0 w-full h-full flex items-center justify-center rounded-none bg-muted transition-opacity duration-200 ${imgLoaded ? "opacity-0" : "opacity-100"}`}
                          >
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                          {/* Render real image if present */}
                          {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0 && (
                            <img
                              src={vehicle.images[0]?.url || ""}
                              alt={`${safeString(vehicle.make, "Vehicle")} ${safeString(vehicle.model)}`}
                              className={`w-full h-full object-cover rounded-none transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                              onLoad={() => handleImageLoad(vehicleId)}
                              onError={() => handleImageError(vehicleId)}
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {safeString(vehicle.make, "Unknown")} {safeString(vehicle.model, "Model")}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {formatVehicleId(safeString(vehicle.id, ""))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {vehicle.type ? (
                        vehicle.type.replace("_", " ")
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(vehicle.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(vehicle.status)}`}
                      >
                        {getStatusText(vehicle.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {vehicle.registration ? vehicle.registration : (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.location ? (
                      <span className="text-sm">{vehicle.location}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </TableCell>
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
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {vehicle.assigned_driver_id ? (
                      <span>
                        {driversById[vehicle.assigned_driver_id]?.name ||
                          "Assigned"}
                        {driversById[vehicle.assigned_driver_id]?.status
                          ? ` (${driversById[vehicle.assigned_driver_id]?.status})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                </TableRow>
              );
              })
              .filter(Boolean)
          )}
        </TableBody>
      </Table>
    );
  }
);

VehicleTable.displayName = "VehicleTable";
