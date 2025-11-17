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
      render={({ field }) => {
        // Ensure value is always a valid string (petrol or diesel)
        const currentValue = field.value === "petrol" || field.value === "diesel" 
          ? field.value 
          : "petrol";
        
        return (
          <FormItem>
            <FormLabel>Fuel Type</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
              }} 
              value={currentValue}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
