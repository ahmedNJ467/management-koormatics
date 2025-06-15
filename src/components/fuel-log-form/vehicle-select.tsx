
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type VehicleSelectProps = {
  form: UseFormReturn<FuelLogFormValues>;
  vehicles: Array<{ id: string; make: string; model: string; registration: string }> | undefined;
};

export function VehicleSelect({ form, vehicles }: VehicleSelectProps) {
  return (
    <FormField
      control={form.control}
      name="vehicle_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vehicle</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} - {vehicle.registration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
