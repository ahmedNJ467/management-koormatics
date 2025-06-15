
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
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";

type FuelDetailsProps = {
  form: UseFormReturn<FuelLogFormValues>;
};

export function FuelDetails({ form }: FuelDetailsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Date</FormLabel>
            <FormControl>
              <DatePicker
                date={field.value ? parseISO(field.value) : undefined}
                onDateChange={(date) =>
                  field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                }
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="fuel_type">Fuel Type</Label>
        <Select
          defaultValue={form.getValues("fuel_type")}
          onValueChange={(value) => form.setValue("fuel_type", value as "petrol" | "diesel" | "cng")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fuel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="petrol">Petrol</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="cng">CNG</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.fuel_type && (
          <p className="text-sm text-destructive">{form.formState.errors.fuel_type.message}</p>
        )}
      </div>
    </>
  );
}
