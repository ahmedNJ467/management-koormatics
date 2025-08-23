
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface FormFooterProps {
  onClose: () => void;
  isEditing: boolean;
}

export function FormFooter({ onClose, isEditing }: FormFooterProps) {
  return (
    <DialogFooter className="pt-4">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit">
        {isEditing ? "Save Changes" : "Book Trip"}
      </Button>
    </DialogFooter>
  );
}
