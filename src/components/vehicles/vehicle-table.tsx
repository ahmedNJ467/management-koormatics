
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
        {vehicles.map((vehicle) => (
          <TableRow 
            key={vehicle.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleVehicleClick(vehicle)}
          >
            <TableCell>{formatVehicleId(vehicle.id)}</TableCell>
            <TableCell>
              {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                <img
                  src={vehicle.vehicle_images[0].image_url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-16 h-16 rounded-lg object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </TableCell>
            <TableCell className="capitalize">{vehicle.type.replace('_', ' ')}</TableCell>
            <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
            <TableCell className="capitalize">{vehicle.status.replace('_', ' ')}</TableCell>
            <TableCell>{vehicle.registration}</TableCell>
            <TableCell>
              {vehicle.insurance_expiry 
                ? new Date(vehicle.insurance_expiry).toLocaleDateString()
                : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

VehicleTable.displayName = "VehicleTable";
