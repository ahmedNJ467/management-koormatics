
import { Button } from "@/components/ui/button";

interface VehicleFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
}

export function VehicleFormActions({ onCancel, isSubmitting, isEdit }: VehicleFormActionsProps) {
  return (
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : isEdit ? "Update Vehicle" : "Add Vehicle"}
      </Button>
    </div>
  );
}
