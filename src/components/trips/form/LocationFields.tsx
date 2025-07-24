import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";
import { useState } from "react";

interface LocationFieldsProps {
  editTrip: DisplayTrip | null;
  serviceType?: UIServiceType;
}

export function LocationFields({ editTrip, serviceType }: LocationFieldsProps) {
  const [stops, setStops] = useState<string[]>([]);

  const addStop = () => setStops([...stops, ""]);

  const updateStop = (index: number, value: string) => {
    const updated = [...stops];
    updated[index] = value;
    setStops(updated);
  };

  const removeStop = (index: number) => {
    const updated = stops.filter((_, i) => i !== index);
    setStops(updated);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Pickup */}
      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          id="pickup_location"
          name="pickup_location"
          placeholder="Enter pickup location"
          defaultValue={editTrip?.pickup_location || ""}
        />
      </div>

      {/* Intermediate Stops */}
      {stops.map((stop, index) => (
        <div key={index} className="space-y-2">
          <Label htmlFor={`stop_${index}`}>{`Stop ${index + 1}`}</Label>
          <div className="flex gap-2">
            <Input
              id={`stop_${index}`}
              name="stops[]"
              placeholder="Enter stop location"
              value={stop}
              onChange={(e) => updateStop(index, e.target.value)}
            />
            <button
              type="button"
              className="text-destructive text-sm"
              onClick={() => removeStop(index)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add stop button */}
      <button
        type="button"
        onClick={addStop}
        className="self-start text-primary text-sm"
      >
        + Add Stop
      </button>

      {/* Drop-off */}
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
