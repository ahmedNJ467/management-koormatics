
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { Vehicle } from "@/lib/types";

type VehicleFormData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

interface VehicleNotesFieldProps {
  form: UseFormReturn<VehicleFormData>;
}

export function VehicleNotesField({ form }: VehicleNotesFieldProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea placeholder="Additional notes about the vehicle" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
