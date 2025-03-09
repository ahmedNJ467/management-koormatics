
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Maintenance } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  expense: z.number().min(0, "Expense must be a positive number"),
  next_scheduled: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
  service_provider: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema> & {
  spare_parts?: { id: string, quantity: number }[];
};

export function useMaintenanceForm(maintenance?: Maintenance) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: maintenance ? {
      vehicle_id: maintenance.vehicle_id,
      date: maintenance.date,
      description: maintenance.description,
      expense: maintenance.cost,
      next_scheduled: maintenance.next_scheduled || "",
      status: maintenance.status,
      notes: maintenance.notes || "",
      service_provider: maintenance.service_provider || "",
    } : {
      vehicle_id: "",
      date: "",
      description: "",
      expense: 0,
      next_scheduled: "",
      status: "scheduled",
      notes: "",
      service_provider: "",
    },
  });

  const handleSubmit = async (values: MaintenanceFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      // For development, skip authentication check
      // In production, uncomment the code below
      /*
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to perform this action");
      }
      */

      const formattedValues = {
        vehicle_id: values.vehicle_id,
        date: values.date,
        description: values.description,
        cost: Number(values.expense),
        status: values.status,
        next_scheduled: values.next_scheduled || null,
        notes: values.notes || null,
        service_provider: values.service_provider || null,
      };

      let maintenanceId = maintenance?.id;

      if (maintenance) {
        const { error: updateError } = await supabase
          .from("maintenance")
          .update(formattedValues)
          .eq("id", maintenance.id)
          .single();

        if (updateError) throw updateError;
      } else {
        const { data: newMaintenance, error: insertError } = await supabase
          .from("maintenance")
          .insert(formattedValues)
          .select()
          .single();

        if (insertError) throw insertError;
        maintenanceId = newMaintenance.id;
      }

      // Handle spare parts if any were selected
      if (values.spare_parts && values.spare_parts.length > 0 && maintenanceId) {
        // Only process spare parts if maintenance is completed
        if (values.status === 'completed') {
          const today = new Date().toISOString().split('T')[0];

          // Update each selected spare part
          for (const part of values.spare_parts) {
            // Get current part data
            const { data: currentPart } = await supabase
              .from("spare_parts")
              .select("quantity, quantity_used")
              .eq("id", part.id)
              .single();

            if (currentPart) {
              const newQuantity = Math.max(0, currentPart.quantity - part.quantity);
              const newQuantityUsed = (currentPart.quantity_used || 0) + part.quantity;

              // Update the spare part
              await supabase
                .from("spare_parts")
                .update({
                  quantity: newQuantity,
                  quantity_used: newQuantityUsed,
                  last_used_date: today,
                  maintenance_id: maintenanceId,
                  status: newQuantity === 0 ? "out_of_stock" : newQuantity <= currentPart.min_stock_level ? "low_stock" : "in_stock"
                })
                .eq("id", part.id);
            }
          }
        }
      }

      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });

      toast({
        title: maintenance ? "Maintenance record updated" : "Maintenance record created",
        description: maintenance 
          ? "The maintenance record has been updated successfully."
          : "A new maintenance record has been created successfully.",
      });

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
