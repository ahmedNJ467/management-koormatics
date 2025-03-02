
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

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
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      </Button>
    </div>
  );
}
