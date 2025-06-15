
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Vehicle } from "@/lib/types";
import { VehicleForm } from "./vehicle-form/vehicle-form";
import { VehicleAuthWrapper } from "./vehicle-form/vehicle-auth-wrapper";
import { useVehicleImages } from "./vehicle-form/use-vehicle-images";
import { useVehicleFormSubmit } from "./vehicle-form/use-vehicle-form-submit";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const { uploadVehicleImages } = useVehicleImages();
  const { onSubmit, isSubmitting } = useVehicleFormSubmit(vehicle, onOpenChange, uploadVehicleImages);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update the details of your vehicle below.' : 'Fill in the details of your new vehicle below.'}
          </DialogDescription>
        </DialogHeader>

        <VehicleAuthWrapper>
          <VehicleForm
            vehicle={vehicle}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </VehicleAuthWrapper>
      </DialogContent>
    </Dialog>
  );
}
