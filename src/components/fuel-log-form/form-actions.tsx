
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
  onDelete?: () => void;
}

export function FormActions({ onCancel, isSubmitting, isEdit, onDelete }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      
      {isEdit && onDelete && (
        <Button 
          type="button" 
          variant="destructive" 
          onClick={onDelete}
        >
          Delete
        </Button>
      )}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      </Button>
    </div>
  );
}
