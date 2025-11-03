import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceForm } from "./maintenance-form/use-maintenance-form";
import { MaintenanceFormContent } from "./maintenance-form/maintenance-form-content";
import { DeleteMaintenanceDialog } from "./maintenance-form/delete-maintenance-dialog";
import type { Maintenance } from "@/lib/types";

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: Maintenance;
  onMaintenanceDeleted?: () => void;
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  maintenance,
  onMaintenanceDeleted,
}: MaintenanceFormDialogProps) {
  const { toast } = useToast();
  const isCompleted = maintenance?.status === "completed";

  const {
    form,
    isSubmitting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleSubmit,
  } = useMaintenanceForm(maintenance);

  useEffect(() => {
    if (maintenance) {
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

      form.reset({
        vehicle_id: maintenance.vehicle_id,
        date: formatDateForInput(maintenance.date),
        description: maintenance.description,
        expense: maintenance.expense,
        next_scheduled: formatDateForInput(maintenance.next_scheduled),
        status: maintenance.status,
        notes: maintenance.notes || "",
        service_provider: maintenance.service_provider || "",
      });
    } else {
      form.reset({
        vehicle_id: "",
        date: "",
        description: "",
        expense: 0,
        next_scheduled: "",
        status: "scheduled" as const,
        notes: "",
        service_provider: "",
      });
    }
  }, [maintenance, form]);

  const onSubmit = async (values: any) => {
    if (!isCompleted) {
      await handleSubmit(values);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {maintenance
                ? isCompleted
                  ? "View Maintenance Record"
                  : "Edit Maintenance Record"
                : "Add Maintenance Record"}
            </DialogTitle>
            <DialogDescription>
              {isCompleted
                ? "Maintenance record details (read-only). You can delete this record if needed."
                : "Enter the maintenance details below. Required fields are marked with an asterisk."}
            </DialogDescription>
          </DialogHeader>
          <MaintenanceFormContent
            form={form}
            maintenance={maintenance}
            isSubmitting={isSubmitting}
            isReadOnly={isCompleted}
            onCancel={() => onOpenChange(false)}
            onDelete={() => setShowDeleteDialog(true)}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>

      <DeleteMaintenanceDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        maintenance={maintenance}
        onDelete={() => {
          setShowDeleteDialog(false);
          onOpenChange(false);
          onMaintenanceDeleted?.();
        }}
      />
    </>
  );
}
