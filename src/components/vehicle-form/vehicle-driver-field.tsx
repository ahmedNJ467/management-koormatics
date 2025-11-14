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

interface DriverOption {
  id: string;
  name: string;
  status?: string | null;
}

interface VehicleDriverFieldProps {
  form: UseFormReturn<VehicleFormData>;
  drivers: DriverOption[];
  isLoading?: boolean;
}

export function VehicleDriverField({
  form,
  drivers,
  isLoading,
}: VehicleDriverFieldProps) {
  return (
    <FormField
      control={form.control}
      name="assigned_driver_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assigned Driver</FormLabel>
          <Select
            value={field.value || "none"}
            onValueChange={(value) =>
              field.onChange(value === "none" ? "" : value)
            }
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                  {driver.status ? ` (${driver.status})` : ""}
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

