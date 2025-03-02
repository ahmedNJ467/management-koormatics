
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFuelLogForm } from "./fuel-log-form/use-fuel-log-form";
import { VehicleSelect } from "./fuel-log-form/vehicle-select";
import { FuelDetails } from "./fuel-log-form/fuel-details";
import { VolumePrice } from "./fuel-log-form/volume-price";
import { MileageFields } from "./fuel-log-form/mileage-fields";
import { NotesField } from "./fuel-log-form/notes-field";
import { FormActions } from "./fuel-log-form/form-actions";
import type { FuelLog } from "@/lib/types";

interface FuelLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog?: FuelLog;
}

export function FuelLogFormDialog({ open, onOpenChange, fuelLog }: FuelLogFormDialogProps) {
  const { form, vehicles, isSubmitting, handleSubmit, shouldCloseDialog, resetCloseDialog } = useFuelLogForm(fuelLog);

  // Effect to close dialog when shouldCloseDialog is true
  useEffect(() => {
    if (shouldCloseDialog) {
      onOpenChange(false);
      resetCloseDialog();
    }
  }, [shouldCloseDialog, onOpenChange, resetCloseDialog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{fuelLog ? "Edit Fuel Log" : "Add New Fuel Log"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-1">
            <VehicleSelect form={form} vehicles={vehicles} />
            <FuelDetails form={form} />
            <VolumePrice form={form} />
            <MileageFields form={form} />
            <NotesField form={form} />
            <FormActions 
              onCancel={() => onOpenChange(false)} 
              isSubmitting={isSubmitting} 
              isEdit={!!fuelLog} 
            />
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
