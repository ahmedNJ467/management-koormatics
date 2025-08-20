
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Vehicle } from "@/lib/types";

type VehicleFormData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

interface VehicleTypeFieldProps {
  form: UseFormReturn<VehicleFormData>;
}

export function VehicleTypeField({ form }: VehicleTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="armoured">Armoured</SelectItem>
              <SelectItem value="soft_skin">Soft Skin</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
