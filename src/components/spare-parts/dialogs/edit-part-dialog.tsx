
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PartForm } from "@/components/spare-parts/part-form";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";
import { SparePart } from "../types";

interface EditPartDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof PartFormSchema>) => void;
  isSubmitting: boolean;
  selectedPart: SparePart | null;
}

export const EditPartDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  selectedPart
}: EditPartDialogProps) => {
  if (!selectedPart) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the details of this spare part.
          </DialogDescription>
        </DialogHeader>
        
        <PartForm 
          onSubmit={(data) => {
            console.log("Edit form submitted with data:", data);
            onSubmit(data);
          }}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          defaultValues={{
            name: selectedPart.name,
            part_number: selectedPart.part_number,
            category: selectedPart.category,
            manufacturer: selectedPart.manufacturer,
            quantity: selectedPart.quantity,
            unit_price: selectedPart.unit_price,
            location: selectedPart.location,
            min_stock_level: selectedPart.min_stock_level,
            compatibility: selectedPart.compatibility || [],
            notes: selectedPart.notes || ""
          }}
          existingImage={selectedPart.part_image}
        />
      </DialogContent>
    </Dialog>
  );
};
