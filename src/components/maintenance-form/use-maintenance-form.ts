
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Maintenance } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  cost: z.number().min(0, "Cost must be a positive number"),
  next_scheduled: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
  service_provider: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function useMaintenanceForm(maintenance?: Maintenance) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: "",
      date: "",
      description: "",
      cost: 0,
      next_scheduled: "",
      status: "scheduled",
      notes: "",
      service_provider: "",
    },
  });

  const handleSubmit = async (values: MaintenanceFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present and properly formatted
      const formattedValues = {
        vehicle_id: values.vehicle_id,
        date: values.date,
        description: values.description,
        cost: Number(values.cost),
        status: values.status,
        // Optional fields are set to null if empty
        next_scheduled: values.next_scheduled || null,
        notes: values.notes || null,
        service_provider: values.service_provider || null,
      };

      if (maintenance) {
        const { error: updateError } = await supabase
          .from("maintenance")
          .update(formattedValues)
          .eq("id", maintenance.id)
          .single();

        if (updateError) throw updateError;

        toast({
          title: "Maintenance record updated",
          description: "The maintenance record has been updated successfully.",
        });
      } else {
        const { error: insertError } = await supabase
          .from("maintenance")
          .insert(formattedValues)
          .single();

        if (insertError) throw insertError;

        toast({
          title: "Maintenance record created",
          description: "A new maintenance record has been created successfully.",
        });
      }

      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save maintenance record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleSubmit,
  };
}
