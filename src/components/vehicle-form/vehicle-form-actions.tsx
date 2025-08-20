import { Button } from "@/components/ui/button";

interface VehicleFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
}

export function VehicleFormActions({
  onCancel,
  isSubmitting,
  isEdit,
}: VehicleFormActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="default"
        className="w-full sm:w-auto font-semibold shadow"
      >
        {isSubmitting ? "Saving..." : isEdit ? "Update Vehicle" : "Add Vehicle"}
      </Button>
    </div>
  );
}
