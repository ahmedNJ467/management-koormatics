
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Vehicle } from "@/lib/types";

type VehicleFormData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

interface VehicleBasicInfoFieldsProps {
  form: UseFormReturn<VehicleFormData>;
}

export function VehicleBasicInfoFields({ form }: VehicleBasicInfoFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="make"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Make</FormLabel>
            <FormControl>
              <Input placeholder="Toyota" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Model</FormLabel>
            <FormControl>
              <Input placeholder="Land Cruiser" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="registration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration</FormLabel>
            <FormControl>
              <Input placeholder="KBZ 123A" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="2024"
                min="1900"
                max={new Date().getFullYear() + 1}
                {...field}
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  // Validate it's a reasonable year
                  if (!value || (value >= 1900 && value <= new Date().getFullYear() + 1)) {
                    field.onChange(value);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
