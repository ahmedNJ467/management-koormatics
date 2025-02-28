
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";

interface ClientFormFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  isEditing: boolean;
  isArchived?: boolean;
}

export function ClientFormFooter({
  isSubmitting,
  onCancel,
  onDelete,
  onRestore,
  isEditing,
  isArchived = false,
}: ClientFormFooterProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4 mt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      
      {isEditing && !isArchived && (
        <Button 
          type="button"
          variant="outline"
          className="text-amber-600 border-amber-600 hover:bg-amber-50"
          onClick={onDelete}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      )}
      
      {isArchived && onRestore && (
        <Button 
          type="button"
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50"
          onClick={onRestore}
        >
          <ArchiveRestore className="h-4 w-4 mr-2" />
          Restore
        </Button>
      )}
      
      {!isArchived && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Client" : "Add Client"}
        </Button>
      )}
    </div>
  );
}
