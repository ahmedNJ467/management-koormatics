
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PartForm } from "@/components/spare-parts/part-form";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";

interface AddPartDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof PartFormSchema>) => void;
  isSubmitting: boolean;
}

export const AddPartDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting
}: AddPartDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new part to your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <PartForm 
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};
