
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

  const handleSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true);
    try {
      if (maintenance) {
        const { error: updateError } = await supabase
          .from("maintenance")
          .update(values)
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
          .insert(values)
          .single();

        if (insertError) throw insertError;

        toast({
          title: "Maintenance record created",
          description: "A new maintenance record has been created successfully.",
        });
      }

      form.reset();
      return true;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save maintenance record",
        variant: "destructive",
      });
      return false;
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
