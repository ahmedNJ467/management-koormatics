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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { getFuelTanks } from "./services/fuel-log-service";

type FuelDetailsProps = {
  form: UseFormReturn<FuelLogFormValues>;
};

export function FuelDetails({ form }: FuelDetailsProps) {
  const [tanks, setTanks] = useState([]);
  const fuelType = form.watch("fuel_type");

  useEffect(() => {
    getFuelTanks().then(setTanks);
  }, []);

  const filteredTanks = tanks.filter((tank) => tank.fuel_type === fuelType);

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

      <FormField
        control={form.control}
        name="fuel_type"
        render={({ field }) => (
          <FormItem className="space-y-2">
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
                <SelectItem value="cng">CNG</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="filled_by"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Filled By</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter name of person who filled the fuel"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tank_id"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Tank</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${fuelType} tank`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filteredTanks.map((tank) => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.name} (Capacity: {tank.capacity}L)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
