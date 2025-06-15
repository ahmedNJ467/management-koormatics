
import { Button } from "@/components/ui/button";
import { Car, Plus } from "lucide-react";

interface VehiclesEmptyStateProps {
  onAddVehicle: () => void;
}

export function VehiclesEmptyState({ onAddVehicle }: VehiclesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Car className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No vehicles found</h3>
      <p className="text-muted-foreground mb-4">Add your first vehicle to get started.</p>
      <Button onClick={onAddVehicle}>
        <Plus className="mr-2 h-4 w-4" /> Add Vehicle
      </Button>
    </div>
  );
}
