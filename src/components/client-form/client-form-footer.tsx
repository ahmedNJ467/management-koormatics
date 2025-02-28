
import { Button } from "@/components/ui/button";

interface ClientFormFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  isEditing: boolean;
}

export function ClientFormFooter({
  isSubmitting,
  onCancel,
  onDelete,
  isEditing,
}: ClientFormFooterProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4 mt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      {isEditing && (
        <Button 
          type="button"
          variant="destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEditing ? "Update Client" : "Add Client"}
      </Button>
    </div>
  );
}
