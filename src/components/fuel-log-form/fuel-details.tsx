
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { fuelLogSchema } from "./use-fuel-log-form";

type FuelDetailsProps = {
  form: UseFormReturn<z.infer<typeof fuelLogSchema>>;
};

export function FuelDetails({ form }: FuelDetailsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...form.register("date")}
        />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

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
