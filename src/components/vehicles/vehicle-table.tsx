
import { memo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { formatVehicleId } from "@/lib/utils";

interface VehicleTableProps {
  vehicles: (Vehicle & { vehicle_images: { image_url: string }[] })[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const VehicleTable = memo(({ vehicles, onVehicleClick }: VehicleTableProps) => {
  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    onVehicleClick(vehicle);
  }, [onVehicleClick]);

  const safeReplace = (value: any, defaultValue: string = 'N/A'): string => {
    // More defensive check - handle any falsy value or non-string type
    if (!value || typeof value !== 'string' || value === 'undefined' || value === 'null') {
      return defaultValue;
    }
    try {
      return value.replace('_', ' ');
    } catch (error) {
      console.warn('Error in safeReplace:', error, 'value:', value);
      return defaultValue;
    }
  };

  const safeString = (value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined || value === 'undefined' || value === 'null') {
      return defaultValue;
    }
    try {
      return String(value);
    } catch (error) {
      console.warn('Error in safeString:', error, 'value:', value);
      return defaultValue;
    }
  };

  // Add safety check for vehicles array
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
          <TableHead>ID</TableHead>
          <TableHead>Image</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Make & Model</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead>Insurance Expiry</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => {
          // Add extra safety check for each vehicle object
          if (!vehicle || typeof vehicle !== 'object') {
            console.warn('Invalid vehicle object:', vehicle);
            return null;
          }

          return (
            <TableRow 
              key={vehicle.id || Math.random()} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleVehicleClick(vehicle)}
            >
              <TableCell>{formatVehicleId(safeString(vehicle.id, ''))}</TableCell>
              <TableCell>
                {vehicle.vehicle_images && Array.isArray(vehicle.vehicle_images) && vehicle.vehicle_images.length > 0 ? (
                  <img
                    src={vehicle.vehicle_images[0]?.image_url || ''}
                    alt={`${safeString(vehicle.make, 'Vehicle')} ${safeString(vehicle.model)}`}
                    className="w-16 h-16 rounded-lg object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="capitalize">{safeReplace(vehicle.type)}</TableCell>
              <TableCell>{`${safeString(vehicle.make, 'Unknown')} ${safeString(vehicle.model, 'Model')}`}</TableCell>
              <TableCell className="capitalize">{safeReplace(vehicle.status)}</TableCell>
              <TableCell>{safeString(vehicle.registration, 'N/A')}</TableCell>
              <TableCell>
                {vehicle.insurance_expiry 
                  ? new Date(vehicle.insurance_expiry).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
            </TableRow>
          );
        }).filter(Boolean)}
      </TableBody>
    </Table>
  );
});

VehicleTable.displayName = "VehicleTable";
