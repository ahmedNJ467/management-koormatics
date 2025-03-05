
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  onMaintenanceDeleted
}: MaintenanceFormDialogProps) {
  const { toast } = useToast();
  const {
    form,
    isSubmitting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleSubmit
  } = useMaintenanceForm(maintenance);

  useEffect(() => {
    if (maintenance) {
      form.reset({
        vehicle_id: maintenance.vehicle_id,
        date: maintenance.date,
        description: maintenance.description,
        expense: maintenance.cost,
        next_scheduled: maintenance.next_scheduled || "",
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
    await handleSubmit(values);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{maintenance ? "Edit Maintenance Record" : "Add Maintenance Record"}</DialogTitle>
            <DialogDescription>
              Enter the maintenance details below. Required fields are marked with an asterisk.
            </DialogDescription>
          </DialogHeader>
          <MaintenanceFormContent
            form={form}
            maintenance={maintenance}
            isSubmitting={isSubmitting}
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
