
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DisplayTrip } from "@/lib/types/trip";

interface LocationFieldsProps {
  editTrip: DisplayTrip | null;
}

export function LocationFields({ editTrip }: LocationFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input 
          id="pickup_location"
          name="pickup_location"
          placeholder="Enter pickup location"
          defaultValue={editTrip?.pickup_location || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input 
          id="dropoff_location"
          name="dropoff_location"
          placeholder="Enter dropoff location"
          defaultValue={editTrip?.dropoff_location || ""}
        />
      </div>
    </div>
  );
}
