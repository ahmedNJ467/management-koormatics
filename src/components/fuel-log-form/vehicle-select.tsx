
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";

type VehicleSelectProps = {
  form: UseFormReturn<FuelLogFormValues>;
  vehicles: Array<{ id: string; make: string; model: string; registration: string }> | undefined;
};

export function VehicleSelect({ form, vehicles }: VehicleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="vehicle_id">Vehicle</Label>
      <Select
        defaultValue={form.getValues("vehicle_id")}
        onValueChange={(value) => form.setValue("vehicle_id", value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a vehicle" />
        </SelectTrigger>
        <SelectContent>
          {vehicles?.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} - {vehicle.registration}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {form.formState.errors.vehicle_id && (
        <p className="text-sm text-destructive">{form.formState.errors.vehicle_id.message}</p>
      )}
    </div>
  );
}
