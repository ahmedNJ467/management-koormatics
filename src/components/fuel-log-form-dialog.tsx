
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFuelLogForm } from "./fuel-log-form/use-fuel-log-form";
import { VehicleSelect } from "./fuel-log-form/vehicle-select";
import { FuelDetails } from "./fuel-log-form/fuel-details";
import { VolumePrice } from "./fuel-log-form/volume-price";
import { MileageFields } from "./fuel-log-form/mileage-fields";
import { NotesField } from "./fuel-log-form/notes-field";
import { FormActions } from "./fuel-log-form/form-actions";
import { DeleteFuelLogDialog } from "./fuel-log-form/delete-fuel-log-dialog";
import type { FuelLog } from "@/lib/types";
import { Form } from "@/components/ui/form";

interface FuelLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog?: FuelLog;
}

export function FuelLogFormDialog({ open, onOpenChange, fuelLog }: FuelLogFormDialogProps) {
  const { form, vehicles, isSubmitting, handleSubmit, shouldCloseDialog, resetCloseDialog } = useFuelLogForm(fuelLog);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Effect to close dialog when shouldCloseDialog is true
  useEffect(() => {
    if (shouldCloseDialog) {
      onOpenChange(false);
      resetCloseDialog();
    }
  }, [shouldCloseDialog, onOpenChange, resetCloseDialog]);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{fuelLog ? "Edit Fuel Log" : "Add New Fuel Log"}</DialogTitle>
            <DialogDescription>
              Enter the fuel log details below. Required fields are marked with an asterisk.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-4rem)] pr-4" type="always">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 px-1">
                <VehicleSelect form={form} vehicles={vehicles} />
                <FuelDetails form={form} />
                <VolumePrice form={form} />
                <MileageFields form={form} />
                <NotesField form={form} />
                <FormActions 
                  onCancel={() => onOpenChange(false)} 
                  isSubmitting={isSubmitting} 
                  isEdit={!!fuelLog}
                  onDelete={fuelLog ? handleDeleteClick : undefined}
                />
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteFuelLogDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        fuelLog={fuelLog}
        onDelete={handleDelete}
      />
    </>
  );
}
