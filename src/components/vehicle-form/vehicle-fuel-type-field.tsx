import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Vehicle } from "@/lib/types";

type VehicleFormData = Omit<Vehicle, "id" | "created_at" | "updated_at">;

interface VehicleFuelTypeFieldProps {
  form: UseFormReturn<VehicleFormData>;
}

export function VehicleFuelTypeField({ form }: VehicleFuelTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="fuel_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Fuel Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
