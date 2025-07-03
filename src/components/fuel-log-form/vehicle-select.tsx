
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type VehicleSelectProps = {
  form: UseFormReturn<FuelLogFormValues>;
  vehicles:
    | Array<{
        id: string;
        make: string;
        model: string;
        registration: string;
        fuel_type?: string;
      }>
    | undefined;
};

export function VehicleSelect({ form, vehicles }: VehicleSelectProps) {
  const handleVehicleChange = (vehicleId: string) => {
    // Set the vehicle_id
    form.setValue("vehicle_id", vehicleId);

    // Find the selected vehicle and auto-populate fuel_type
    const selectedVehicle = vehicles?.find((v) => v.id === vehicleId);
    if (selectedVehicle?.fuel_type) {
      const validFuelTypes = ["petrol", "diesel", "cng"] as const;
      const fuelType = selectedVehicle.fuel_type.toLowerCase();
      if (validFuelTypes.includes(fuelType as any)) {
        form.setValue("fuel_type", fuelType as "petrol" | "diesel" | "cng");
      }
    }
  };

  return (
    <FormField
      control={form.control}
      name="vehicle_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vehicle</FormLabel>
          <Select
            onValueChange={handleVehicleChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} - {vehicle.registration}
                  {vehicle.fuel_type && (
                    <span className="text-muted-foreground ml-2">
                      ({vehicle.fuel_type})
                    </span>
                  )}
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
