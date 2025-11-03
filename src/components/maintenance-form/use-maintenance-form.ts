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
  spare_parts?: { id: string; quantity: number }[];
};

export function useMaintenanceForm(maintenance?: Maintenance) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Format dates for HTML date input (YYYY-MM-DD format)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: maintenance
      ? {
          vehicle_id: maintenance.vehicle_id,
          date: formatDateForInput(maintenance.date),
          description: maintenance.description,
          expense: maintenance.expense,
          next_scheduled: formatDateForInput(maintenance.next_scheduled),
          status: maintenance.status,
          notes: maintenance.notes || "",
          service_provider: maintenance.service_provider || "",
        }
      : {
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
        expense: Number(values.expense), // Column name matches form field exactly
        status: values.status,
        next_scheduled: values.next_scheduled || null, // Column name matches form field exactly
        notes: values.notes || null,
        service_provider: values.service_provider || null,
      };

      let maintenanceId = maintenance?.id;

      if (maintenance) {
        const { error: updateError } = await supabase
          .from("maintenance")
          .update(formattedValues as any)
          .eq("id", maintenance.id as any)
          .select("id")
          .single();

        if (updateError) {
          console.error("Maintenance update error:", updateError);
          throw new Error(updateError.message || `Failed to update maintenance: ${updateError.code || "Unknown error"}`);
        }
      } else {
        const { data: newMaintenance, error: insertError } = await supabase
          .from("maintenance")
          .insert(formattedValues as any)
          .select("id, vehicle_id, date, description, expense, status, service_provider, notes, created_at, updated_at, next_scheduled")
          .single();

        if (insertError) {
          console.error("Maintenance insert error:", insertError);
          throw new Error(insertError.message || `Failed to create maintenance: ${insertError.code || "Unknown error"}`);
        }
        if (newMaintenance && "id" in newMaintenance) {
          maintenanceId = newMaintenance.id as any;
        }
      }

      // Handle spare parts if any were selected
      if (
        values.spare_parts &&
        values.spare_parts.length > 0 &&
        maintenanceId
      ) {
        // Only process spare parts if maintenance is completed
        if (values.status === "completed") {
          const today = new Date().toISOString().split("T")[0];

          // Update each selected spare part
          for (const part of values.spare_parts) {
            // Get current part data
            const { data: currentPart, error: partFetchError } = await supabase
              .from("spare_parts")
              .select("quantity, quantity_used, min_stock_level")
              .eq("id", part.id as any)
              .single();

            if (partFetchError) {
              console.error("Error fetching spare part:", partFetchError);
              throw new Error(`Failed to fetch spare part: ${partFetchError.message || "Unknown error"}`);
            }

            if (currentPart && "quantity" in currentPart) {
              const newQuantity = Math.max(
                0,
                (currentPart as any).quantity - part.quantity
              );
              const newQuantityUsed =
                ((currentPart as any).quantity_used || 0) + part.quantity;

              // Update the spare part
              const { error: partUpdateError } = await supabase
                .from("spare_parts")
                .update({
                  quantity: newQuantity,
                  quantity_used: newQuantityUsed,
                  last_used_date: today,
                  maintenance_id: maintenanceId,
                  status:
                    newQuantity === 0
                      ? "out_of_stock"
                      : newQuantity <= (currentPart as any).min_stock_level
                      ? "low_stock"
                      : "in_stock",
                } as any)
                .eq("id", part.id as any);

              if (partUpdateError) {
                console.error("Error updating spare part:", partUpdateError);
                throw new Error(`Failed to update spare part: ${partUpdateError.message || "Unknown error"}`);
              }
            }
          }
        }
      }

      // Create next scheduled maintenance if current maintenance is completed and has next_scheduled date
      if (values.status === "completed" && values.next_scheduled) {
        const nextMaintenanceData = {
          vehicle_id: values.vehicle_id,
          date: values.next_scheduled,
          description: `Follow-up: ${values.description}`,
          expense: 0, // Default expense for scheduled maintenance
          status: "scheduled" as const, // Fix TypeScript issue by using 'as const'
          next_scheduled: null, // Column name matches form field exactly
          notes: `Auto-generated follow-up maintenance for previous service on ${values.date}`,
          service_provider: values.service_provider || null,
        };

        const { error: nextMaintenanceError } = await supabase
          .from("maintenance")
          .insert(nextMaintenanceData as any);

        if (nextMaintenanceError) {
          console.error(
            "Error creating next scheduled maintenance:",
            nextMaintenanceError
          );
          // Don't throw error as main maintenance was successful
          toast({
            title: "Warning",
            description:
              "Maintenance completed but failed to create next scheduled maintenance",
            variant: "destructive",
          });
        } else {
          console.log("Next scheduled maintenance created successfully");
        }
      }

      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });

      const successMessage = maintenance
        ? "Maintenance record updated"
        : "Maintenance record created";

      const successDescription = maintenance
        ? "The maintenance record has been updated successfully."
        : "A new maintenance record has been created successfully.";

      // Add info about next scheduled maintenance if it was created
      const finalDescription =
        values.status === "completed" && values.next_scheduled
          ? `${successDescription} Next scheduled maintenance has been automatically created for ${values.next_scheduled}.`
          : successDescription;

      toast({
        title: successMessage,
        description: finalDescription,
      });

      form.reset();
    } catch (error) {
      console.error("Error:", error);
      
      // Better error message extraction
      let errorMessage = "Failed to save maintenance record";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Handle Supabase errors
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error) {
          errorMessage = supabaseError.error;
        } else if (supabaseError.code) {
          errorMessage = `Error ${supabaseError.code}: ${supabaseError.message || "Unknown error"}`;
        } else {
          // Try to stringify the error object
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "An unknown error occurred";
          }
        }
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
    isSubmitting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleSubmit,
  };
}
