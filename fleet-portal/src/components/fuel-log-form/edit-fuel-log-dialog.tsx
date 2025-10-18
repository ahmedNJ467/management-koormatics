import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFuelLogForm } from "./use-fuel-log-form";
import { VehicleSelect } from "./vehicle-select";
import { FuelDetails } from "./fuel-details";
import { VolumePrice } from "./volume-price";
import { MileageFields } from "./mileage-fields";
import { NotesField } from "./notes-field";
import { FormActions } from "./form-actions";
import { DeleteFuelLogDialog } from "./delete-fuel-log-dialog";
import type { FuelLog } from "@/lib/types";
import { Form } from "@/components/ui/form";

interface EditFuelLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog: FuelLog;
}

export function EditFuelLogDialog({
  open,
  onOpenChange,
  fuelLog,
}: EditFuelLogDialogProps) {
  const {
    form,
    vehicles,
    isSubmitting,
    handleSubmit,
    shouldCloseDialog,
    resetCloseDialog,
    hasPreviousMileage,
  } = useFuelLogForm(fuelLog); // Pass fuelLog for edit mode

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
            <DialogTitle>Edit Fuel Log</DialogTitle>
            <DialogDescription>
              Update the fuel log details below. Required fields are marked with
              an asterisk.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-4rem)] pr-4" type="always">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 px-1"
              >
                <VehicleSelect form={form} vehicles={vehicles} />
                <FuelDetails form={form} vehicles={vehicles} />
                <VolumePrice form={form} />
                <MileageFields
                  form={form}
                  hasPreviousMileage={hasPreviousMileage}
                />
                <NotesField form={form} />
                <FormActions
                  onCancel={() => onOpenChange(false)}
                  isSubmitting={isSubmitting}
                  isEdit={true}
                  onDelete={handleDeleteClick}
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
