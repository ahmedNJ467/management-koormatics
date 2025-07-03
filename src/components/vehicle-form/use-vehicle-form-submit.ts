import { useState } from "react";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiErrorHandler } from "@/lib/api-error-handler";
import { useVehicleImages } from "./use-vehicle-images";

export function useVehicleFormSubmit(
  vehicle: Vehicle | undefined,
  onOpenChange: (open: boolean) => void,
  uploadVehicleImages: (vehicleId: string) => Promise<void>
) {
  const { toast } = useToast();
  const { handleError } = useApiErrorHandler();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if fuel_type column exists in the vehicles table
  const checkFuelTypeColumnExists = async (): Promise<boolean> => {
    try {
      // Try a simple query that would fail if fuel_type column doesn't exist
      const { error } = await supabase
        .from("vehicles")
        .select("fuel_type")
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  };

  const onSubmit = async (
    data: Omit<Vehicle, "id" | "created_at" | "updated_at">
  ) => {
    try {
      setIsSubmitting(true);
      let operationSuccess = false;
      let partialSuccess = false;

      // Check if fuel_type column exists
      const fuelTypeSupported = await checkFuelTypeColumnExists();
      console.log("Fuel type column supported:", fuelTypeSupported);

      // Prepare the data, excluding fuel_type if it's not supported yet
      const formattedData = {
        make: data.make,
        model: data.model,
        registration: data.registration.trim().toUpperCase(),
        type: data.type,
        status: data.status,
        year: data.year ? Number(data.year) : null,
        color: data.color || null,
        vin: data.vin || null,
        insurance_expiry: data.insurance_expiry || null,
        notes: data.notes || null,
      };

      // Only include fuel_type if the column exists and has a value
      const dataToSend =
        fuelTypeSupported && data.fuel_type
          ? { ...formattedData, fuel_type: data.fuel_type }
          : formattedData;

      // Notify user if fuel_type was provided but not supported
      const shouldNotifyFuelType = !fuelTypeSupported && data.fuel_type;

      if (vehicle) {
        // Check for existing vehicle with same registration
        const { data: existingVehicle, error: checkError } = await supabase
          .from("vehicles")
          .select("id")
          .eq("registration", formattedData.registration)
          .not("id", "eq", vehicle.id)
          .maybeSingle();

        if (checkError) {
          console.error("Check existing vehicle error:", checkError);
          throw checkError;
        }

        if (existingVehicle) {
          throw new ApiError(
            `A vehicle with registration ${formattedData.registration} already exists`,
            409
          );
        }

        // Try to update the vehicle
        const { error } = await supabase
          .from("vehicles")
          .update(dataToSend)
          .eq("id", vehicle.id);

        if (error) {
          console.error("Update vehicle error:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          console.error("Data being sent:", dataToSend);

          // If the error is about fuel_type column not existing, try without it
          if (error.message?.includes("fuel_type") || error.code === "42703") {
            const { fuel_type, ...dataWithoutFuelType } = dataToSend as any;
            console.log("Retrying without fuel_type:", dataWithoutFuelType);

            const { error: retryError } = await supabase
              .from("vehicles")
              .update(dataWithoutFuelType)
              .eq("id", vehicle.id);

            if (retryError) {
              console.error("Retry error:", retryError);
              throw retryError;
            }

            partialSuccess = true;
          } else {
            throw error;
          }
        } else {
          operationSuccess = true;
        }

        await uploadVehicleImages(vehicle.id);
      } else {
        // Check for existing vehicle with same registration (for new vehicles)
        try {
          const { data: existingVehicle, error: checkError } = await supabase
            .from("vehicles")
            .select("id")
            .eq("registration", formattedData.registration)
            .maybeSingle();

          if (checkError) {
            console.error("Check existing vehicle error:", checkError);
            throw checkError;
          }

          if (existingVehicle) {
            throw new ApiError(
              `A vehicle with registration ${formattedData.registration} already exists`,
              409
            );
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            throw error;
          }
          console.warn("Error checking existing vehicle:", error);
        }

        // Try to insert the new vehicle
        const { data: newVehicle, error } = await supabase
          .from("vehicles")
          .insert(dataToSend)
          .select()
          .single();

        if (error) {
          console.error("Insert vehicle error:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          console.error("Data being sent:", dataToSend);

          // If the error is about fuel_type column not existing, try without it
          if (error.message?.includes("fuel_type") || error.code === "42703") {
            const { fuel_type, ...dataWithoutFuelType } = dataToSend as any;
            console.log(
              "Retrying insert without fuel_type:",
              dataWithoutFuelType
            );

            const { data: retryVehicle, error: retryError } = await supabase
              .from("vehicles")
              .insert(dataWithoutFuelType)
              .select()
              .single();

            if (retryError) {
              console.error("Retry insert error:", retryError);
              throw retryError;
            }

            if (retryVehicle) {
              await uploadVehicleImages(retryVehicle.id);
            }

            partialSuccess = true;
          } else {
            throw error;
          }
        } else if (newVehicle) {
          await uploadVehicleImages(newVehicle.id);
          operationSuccess = true;
        }
      }

      // Show appropriate success message
      if (partialSuccess) {
        toast({
          title: "Partial Success",
          description: `Vehicle ${
            vehicle ? "updated" : "added"
          } successfully. Fuel type will be available after database migration.`,
          variant: "default",
        });
      } else if (operationSuccess) {
        if (shouldNotifyFuelType) {
          toast({
            title: "Success",
            description: `Vehicle ${
              vehicle ? "updated" : "added"
            } successfully. Fuel type will be available after database migration.`,
          });
        } else {
          toast({
            title: "Success",
            description: `Vehicle ${
              vehicle ? "updated" : "added"
            } successfully`,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onOpenChange(false);
    } catch (error) {
      handleError(
        error,
        error instanceof ApiError
          ? error.message
          : "Failed to save vehicle. Please check if a vehicle with the same registration already exists."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
}
