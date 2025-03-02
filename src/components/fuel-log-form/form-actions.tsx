
import { Button } from "@/components/ui/button";

type FormActionsProps = {
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
};

export function FormActions({ onCancel, isSubmitting, isEdit }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      </Button>
    </div>
  );
}
