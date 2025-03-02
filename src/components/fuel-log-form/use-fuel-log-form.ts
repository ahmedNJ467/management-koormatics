import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  date: z.string().min(1, "Date is required"),
  fuel_type: z.enum(["petrol", "diesel", "cng"]),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  price_per_liter: z.number().min(0.01, "Price per liter must be greater than 0"),
  cost: z.number().min(0.01, "Cost must be greater than 0"),
  previous_mileage: z.number().min(0, "Previous mileage must be a positive number"),
  current_mileage: z.number().min(0, "Current mileage must be a positive number"),
  mileage: z.number().min(0, "Mileage must be a positive number"),
  notes: z.string().optional(),
}).refine(data => data.current_mileage >= data.previous_mileage, {
  message: "Current mileage must be greater than or equal to previous mileage",
  path: ["current_mileage"],
});

export type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

export function useFuelLogForm(fuelLog?: FuelLog) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shouldCloseDialog, setShouldCloseDialog] = useState(false);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, registration')
        .order('make');
      
      if (error) throw error;
      return data;
    },
  });

  const getLatestMileage = async (vehicleId: string) => {
    if (!vehicleId) return 0;
    
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('current_mileage')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) return 0;
    return data[0]?.current_mileage || 0;
  };

  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: fuelLog ? {
      vehicle_id: fuelLog.vehicle_id,
      date: fuelLog.date,
      fuel_type: fuelLog.fuel_type,
      volume: fuelLog.volume,
      price_per_liter: fuelLog.cost / fuelLog.volume,
      cost: fuelLog.cost,
      previous_mileage: fuelLog.previous_mileage || 0,
      current_mileage: fuelLog.current_mileage || 0,
      mileage: fuelLog.mileage,
      notes: fuelLog.notes || "",
    } : {
      vehicle_id: "",
      date: new Date().toISOString().split('T')[0],
      fuel_type: "diesel",
      volume: 0,
      price_per_liter: 0,
      cost: 0,
      previous_mileage: 0,
      current_mileage: 0,
      mileage: 0,
      notes: "",
    },
  });

  const volume = form.watch("volume");
  const pricePerLiter = form.watch("price_per_liter");
  const previousMileage = form.watch("previous_mileage");
  const currentMileage = form.watch("current_mileage");
  const vehicleId = form.watch("vehicle_id");

  useEffect(() => {
    if (volume && pricePerLiter) {
      const calculatedCost = volume * pricePerLiter;
      form.setValue("cost", Number(calculatedCost.toFixed(2)));
    } else {
      form.setValue("cost", 0);
    }
  }, [volume, pricePerLiter, form]);

  useEffect(() => {
    if (currentMileage >= 0 && previousMileage >= 0) {
      const distance = Math.max(0, currentMileage - previousMileage);
      form.setValue("mileage", distance);
    } else {
      form.setValue("mileage", 0);
    }
  }, [currentMileage, previousMileage, form]);

  useEffect(() => {
    if (vehicleId && !fuelLog) {
      const fetchMileage = async () => {
        const lastMileage = await getLatestMileage(vehicleId);
        form.setValue("previous_mileage", lastMileage);
      };
      fetchMileage();
    }
  }, [vehicleId, form, fuelLog]);

  const handleSubmit = async (values: FuelLogFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      const formattedValues = {
        vehicle_id: values.vehicle_id,
        date: values.date,
        fuel_type: values.fuel_type as "petrol" | "diesel" | "cng",
        volume: Number(values.volume),
        cost: Number(values.cost),
        previous_mileage: Number(values.previous_mileage),
        current_mileage: Number(values.current_mileage),
        mileage: Number(values.mileage),
        notes: values.notes || null
      };

      if (fuelLog) {
        const { error: updateError } = await supabase
          .from("fuel_logs")
          .update(formattedValues as any)
          .eq("id", fuelLog.id);

        if (updateError) throw updateError;

        toast({
          title: "Fuel log updated",
          description: "The fuel log has been updated successfully.",
        });
      } else {
        const { error: insertError } = await supabase
          .from("fuel_logs")
          .insert(formattedValues as any);

        if (insertError) throw insertError;

        toast({
          title: "Fuel log created",
          description: "A new fuel log has been created successfully.",
        });
      }

      form.reset();
      setShouldCloseDialog(true);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save fuel log",
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
    resetCloseDialog: () => setShouldCloseDialog(false)
  };
}
