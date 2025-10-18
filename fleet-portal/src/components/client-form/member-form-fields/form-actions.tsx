
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isEditing: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function FormActions({ isEditing, onCancel, onSave }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onSave}>
        {isEditing ? "Update Member" : "Add Member"}
      </Button>
    </div>
  );
}
