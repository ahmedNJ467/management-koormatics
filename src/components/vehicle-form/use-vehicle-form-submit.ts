
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

  const onSubmit = async (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsSubmitting(true);
      
      const formattedData = {
        ...data,
        year: data.year ? Number(data.year) : null,
        insurance_expiry: data.insurance_expiry || null,
        registration: data.registration.trim().toUpperCase(),
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formattedData)
          .eq('id', vehicle.id);

        if (error) {
          console.error("Update vehicle error:", error);
          throw error;
        }
        
        await uploadVehicleImages(vehicle.id);
      } else {
        try {
          const { data: existingVehicle, error: checkError } = await supabase
            .from('vehicles')
            .select('id')
            .eq('registration', formattedData.registration)
            .maybeSingle();
          
          if (checkError) {
            console.error("Check existing vehicle error:", checkError);
            throw checkError;
          }
          
          if (existingVehicle) {
            throw new ApiError(`A vehicle with registration ${formattedData.registration} already exists`, 409);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            throw error;
          }
          console.warn("Error checking existing vehicle:", error);
        }
        
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert(formattedData)
          .select()
          .single();

        if (error) {
          console.error("Insert vehicle error:", error);
          throw error;
        }
        
        if (newVehicle) {
          await uploadVehicleImages(newVehicle.id);
        }
      }

      toast({
        title: "Success",
        description: `Vehicle ${vehicle ? 'updated' : 'added'} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onOpenChange(false);
    } catch (error) {
      handleError(error, error instanceof ApiError ? error.message : "Failed to save vehicle. Please check if a vehicle with the same registration already exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
}
