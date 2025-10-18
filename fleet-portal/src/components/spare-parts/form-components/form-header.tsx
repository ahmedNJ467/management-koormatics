
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormHeaderProps {
  onCancel: () => void;
  isSubmitting: boolean;
  defaultValues?: any;
}

export const FormActions = ({ onCancel, isSubmitting, defaultValues }: FormHeaderProps) => {
  return (
    <DialogFooter className="flex justify-between sm:justify-end gap-3 pt-4 mt-4 border-t bg-background">
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {isSubmitting ? "Saving..." : defaultValues ? "Update Part" : "Save Part"}
      </Button>
    </DialogFooter>
  );
};
