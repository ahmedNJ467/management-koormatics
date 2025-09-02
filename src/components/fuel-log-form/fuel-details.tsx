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
  FormDescription,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { getFuelStorages } from "./services/fuel-log-service";
import { Badge } from "@/components/ui/badge";
import { Fuel } from "lucide-react";

type FuelDetailsProps = {
  form: UseFormReturn<FuelLogFormValues>;
  vehicles?: Array<{
    id: string;
    make: string;
    model: string;
    registration: string;
    fuel_type?: string;
  }>;
};

export function FuelDetails({ form, vehicles }: FuelDetailsProps) {
  const [tanks, setTanks] = useState<any[]>([]);
  const fuelType = form.watch("fuel_type");
  const vehicleId = form.watch("vehicle_id");

  useEffect(() => {
    getFuelStorages().then(setTanks);
  }, []);

  const filteredTanks = tanks.filter((tank) => tank.fuel_type === fuelType);

  // Auto-select tank when fuel type changes
  useEffect(() => {
    if (fuelType && filteredTanks.length > 0) {
      // Prefer the first available storage for the selected fuel type
      const mainTank = filteredTanks[0];

      if (mainTank && form.getValues("fuel_management_id") !== mainTank.id) {
        console.log(`Auto-selecting storage for fuel type: ${fuelType}`);
        form.setValue("fuel_management_id", mainTank.id);
      }
    }
  }, [fuelType, filteredTanks, form]);

  // Find the selected vehicle to check if fuel type is auto-populated
  const selectedVehicle = vehicles?.find((v) => v.id === vehicleId);
  const isAutoPopulated = selectedVehicle?.fuel_type && vehicleId;

  const getFuelTypeDisplay = (fuelType: string) => {
    const fuelTypeMap = {
      petrol: "Petrol",
      diesel: "Diesel",
    };
    return fuelTypeMap[fuelType as keyof typeof fuelTypeMap] || fuelType;
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case "diesel":
        return "text-orange-600";
      case "petrol":
        return "text-gray-600";
      default:
        return "text-muted-foreground";
    }
  };

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
            {isAutoPopulated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span
                    className={`font-medium ${getFuelTypeColor(field.value)}`}
                  >
                    {getFuelTypeDisplay(field.value)}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Auto-filled from vehicle
                  </Badge>
                </div>
                <FormDescription className="text-xs">
                  Fuel type automatically selected based on vehicle's fuel type.
                  To change, select a different vehicle.
                </FormDescription>
              </div>
            ) : (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Temporarily commented out - filled_by column doesn't exist in database yet
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
      */}

      {/* Storage selection removed from fuel log form */}
    </>
  );
}
