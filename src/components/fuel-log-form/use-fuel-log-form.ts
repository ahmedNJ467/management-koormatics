import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FuelLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fuelLogSchema, FuelLogFormValues } from "./schemas/fuel-log-schema";
import {
  getVehicles,
  getLatestMileage,
  saveFuelLog,
  getFuelLogById,
  broadcastTankUpdate,
} from "./services/fuel-log-service";
import { useFuelCalculations } from "./hooks/use-fuel-calculations";

export { fuelLogSchema, type FuelLogFormValues };

export function useFuelLogForm(fuelLog?: FuelLog) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldCloseDialog, setShouldCloseDialog] = useState(false);
  const [hasPreviousMileage, setHasPreviousMileage] = useState(false);

  // Fetch vehicles for select dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const result = await getVehicles();
      return result.map((vehicle) => ({
        ...vehicle,
        fuel_type: (vehicle as any).fuel_type || "diesel", // Ensure fuel_type is always present
      }));
    },
  });

  // Initialize form with default values or existing fuel log data
  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: fuelLog
      ? {
          vehicle_id: fuelLog.vehicle_id,
          date: fuelLog.date,
          fuel_type: fuelLog.fuel_type,
          volume: fuelLog.volume,
          price_per_liter:
            fuelLog.volume > 0 ? fuelLog.cost / fuelLog.volume : 0,
          cost: fuelLog.cost,
          previous_mileage: fuelLog.previous_mileage || 0,
          current_mileage: fuelLog.current_mileage || 0,
          mileage: fuelLog.mileage || 0,
          notes: fuelLog.notes || "",
          tank_id: (fuelLog as any).tank_id || "",
        }
      : {
          vehicle_id: "",
          date: new Date().toISOString().split("T")[0],
          fuel_type: "diesel",
          volume: 0,
          price_per_liter: 0,
          cost: 0,
          previous_mileage: 0,
          current_mileage: 0,
          mileage: 0,
          notes: "",
          tank_id: "",
        },
  });

  // Apply calculations for cost and mileage
  useFuelCalculations(form);

  // When editing an existing fuel log, we always have a previous mileage context
  useEffect(() => {
    if (fuelLog) {
      setHasPreviousMileage(true);
    }
  }, [fuelLog]);

  const vehicleId = form.watch("vehicle_id");

  // Load previous mileage and set fuel type when vehicle changes
  useEffect(() => {
    if (!vehicleId) return;

    const fetchMileage = async () => {
      try {
        console.log("Vehicle ID changed to:", vehicleId);

        // If editing existing fuel log, don't override the previous mileage
        if (fuelLog && fuelLog.vehicle_id === vehicleId) {
          console.log(
            "Editing existing fuel log, keeping previous mileage:",
            fuelLog.previous_mileage
          );
          return;
        }

        // Otherwise, get the latest mileage for this vehicle
        console.log("Fetching latest mileage for vehicle:", vehicleId);
        const lastMileage = await getLatestMileage(vehicleId);
        console.log("Fetched last mileage:", lastMileage);

        // Set previous mileage to the last recorded mileage
        form.setValue("previous_mileage", lastMileage.value);
        setHasPreviousMileage(lastMileage.hasPrevious);

        // Clear current mileage so user can fill it in with new value
        if (!fuelLog) {
          form.setValue("current_mileage", 0);
        }

        // Auto-populate fuel type if vehicle has one
        const selectedVehicle = vehicles?.find((v) => v.id === vehicleId);
        if ((selectedVehicle as any)?.fuel_type && !fuelLog) {
          console.log(
            `Auto-setting fuel type to: ${(selectedVehicle as any).fuel_type}`
          );
          form.setValue(
            "fuel_type",
            (selectedVehicle as any).fuel_type as "petrol" | "diesel"
          );
        }
      } catch (error) {
        console.error("Error fetching latest mileage:", error);
      }
    };

    fetchMileage();
  }, [vehicleId, form, fuelLog, vehicles]);

  // Handle form submission
  const handleSubmit = async (values: FuelLogFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      console.log("Form submission started with values:", values);

      // Validate the form data
      const validationResult = fuelLogSchema.safeParse(values);
      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error);
        throw new Error(
          "Form validation failed: " + validationResult.error.message
        );
      }

      console.log("Form validation passed, saving fuel log...");
      const result = await saveFuelLog(values, fuelLog?.id);

      // Invalidate and refetch queries to ensure the UI updates
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });

      // Also invalidate tank-related queries to update fuel tank progress
      queryClient.invalidateQueries({ queryKey: ["fuel-tanks"] });
      queryClient.invalidateQueries({ queryKey: ["tank-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tank-dispensed"] });

      // Broadcast tank update event to refresh tank data in other components
      broadcastTankUpdate();

      toast({
        title: result.isNewRecord ? "Fuel log created" : "Fuel log updated",
        description: result.isNewRecord
          ? "A new fuel log has been created successfully. Tank levels updated."
          : "The fuel log has been updated successfully. Tank levels updated.",
      });

      form.reset();
      setShouldCloseDialog(true);
    } catch (error) {
      console.error("Form submission error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to save fuel log";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = (error as any).message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    vehicles,
    isSubmitting,
    handleSubmit,
    shouldCloseDialog,
    resetCloseDialog: () => setShouldCloseDialog(false),
    hasPreviousMileage,
  };
}
