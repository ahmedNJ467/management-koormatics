
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog, FuelType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  date: z.string().min(1, "Date is required"),
  fuel_type: z.enum(["petrol", "diesel", "cng"]),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  cost: z.number().min(0.01, "Cost must be greater than 0"),
  mileage: z.number().min(0, "Mileage must be a positive number"),
  notes: z.string().optional(),
});

type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

export function useFuelLogForm(fuelLog?: FuelLog) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: fuelLog ? {
      vehicle_id: fuelLog.vehicle_id,
      date: fuelLog.date,
      fuel_type: fuelLog.fuel_type,
      volume: fuelLog.volume,
      cost: fuelLog.cost,
      mileage: fuelLog.mileage,
      notes: fuelLog.notes || "",
    } : {
      vehicle_id: "",
      date: new Date().toISOString().split('T')[0],
      fuel_type: "diesel",
      volume: 0,
      cost: 0,
      mileage: 0,
      notes: "",
    },
  });

  const handleSubmit = async (values: FuelLogFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Type assertion to make TypeScript happy as we've updated the database schema
      const formattedValues = {
        vehicle_id: values.vehicle_id,
        date: values.date,
        fuel_type: values.fuel_type,
        volume: Number(values.volume),
        cost: Number(values.cost),
        mileage: Number(values.mileage),
        notes: values.notes || null
      };

      if (fuelLog) {
        const { error: updateError } = await supabase
          .from("fuel_logs")
          .update(formattedValues as any) // Type assertion needed until types are regenerated
          .eq("id", fuelLog.id);

        if (updateError) throw updateError;

        toast({
          title: "Fuel log updated",
          description: "The fuel log has been updated successfully.",
        });
      } else {
        const { error: insertError } = await supabase
          .from("fuel_logs")
          .insert(formattedValues as any); // Type assertion needed until types are regenerated

        if (insertError) throw insertError;

        toast({
          title: "Fuel log created",
          description: "A new fuel log has been created successfully.",
        });
      }

      form.reset();
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
  };
}
