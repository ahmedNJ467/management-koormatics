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
import { getFuelTanks } from "./services/fuel-log-service";
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
  const [tanks, setTanks] = useState([]);
  const fuelType = form.watch("fuel_type");
  const vehicleId = form.watch("vehicle_id");

  useEffect(() => {
    getFuelTanks().then(setTanks);
  }, []);

  const filteredTanks = tanks.filter((tank) => tank.fuel_type === fuelType);

  // Auto-select tank when fuel type changes
  useEffect(() => {
    if (fuelType && filteredTanks.length > 0) {
      // Find the main underground tank for this fuel type
      const mainTank =
        filteredTanks.find(
          (tank) =>
            tank.name.toLowerCase().includes("underground") ||
            tank.name.toLowerCase().includes("main")
        ) || filteredTanks[0]; // Fallback to first tank if no "underground" tank found

      if (mainTank && form.getValues("tank_id") !== mainTank.id) {
        console.log(
          `Auto-selecting tank: ${mainTank.name} for fuel type: ${fuelType}`
        );
        form.setValue("tank_id", mainTank.id);
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
      hybrid: "Hybrid",
      electric: "Electric",
      cng: "CNG",
    };
    return fuelTypeMap[fuelType as keyof typeof fuelTypeMap] || fuelType;
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case "electric":
        return "text-green-600";
      case "hybrid":
        return "text-blue-600";
      case "diesel":
        return "text-orange-600";
      case "petrol":
        return "text-gray-600";
      case "cng":
        return "text-purple-600";
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
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
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

      <FormField
        control={form.control}
        name="tank_id"
        render={({ field }) => {
          const selectedTank = tanks.find((tank) => tank.id === field.value);
          const isAutoSelected =
            fuelType && filteredTanks.length > 0 && field.value;

          return (
            <FormItem className="space-y-2">
              <FormLabel>Tank</FormLabel>
              {isAutoSelected && selectedTank ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedTank.name} (Capacity: {selectedTank.capacity}L)
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Auto-selected
                    </Badge>
                  </div>
                  <FormDescription className="text-xs">
                    Underground tank automatically selected based on fuel type.
                  </FormDescription>
                </div>
              ) : (
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
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </>
  );
}
