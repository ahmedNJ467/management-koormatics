
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vehicle, Driver } from "@/lib/types";

interface VehicleDriverFieldsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  defaultVehicleId?: string;
  defaultDriverId?: string;
}

export function VehicleDriverFields({ 
  vehicles, 
  drivers, 
  defaultVehicleId, 
  defaultDriverId 
}: VehicleDriverFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <Select name="vehicle_id" defaultValue={defaultVehicleId}>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.registration})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="driver_id">Driver</Label>
        <Select name="driver_id" defaultValue={defaultDriverId}>
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
