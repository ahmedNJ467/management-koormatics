import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  selectedPart,
}: EditPartDialogProps) => {
  if (!selectedPart) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the details for this spare part.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <PartForm
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
            defaultValues={selectedPart}
            existingImage={selectedPart.part_image}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
