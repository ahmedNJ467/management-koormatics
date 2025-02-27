
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LocationFieldsProps {
  defaultPickup?: string;
  defaultDropoff?: string;
}

export function LocationFields({ defaultPickup = "", defaultDropoff = "" }: LocationFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          id="pickup_location"
          name="pickup_location"
          defaultValue={defaultPickup}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input
          id="dropoff_location"
          name="dropoff_location"
          defaultValue={defaultDropoff}
        />
      </div>
    </>
  );
}
