
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UIServiceType } from "../trip-form";

interface ServiceTypeFieldProps {
  value: UIServiceType;
  onChange: (value: UIServiceType) => void;
}

export function ServiceTypeField({ value, onChange }: ServiceTypeFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="service_type">Service Type</Label>
      <Select
        name="service_type"
        value={value}
        onValueChange={(value) => onChange(value as UIServiceType)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select service type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
          <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
          <SelectItem value="hourly">Hourly Chauffeur</SelectItem>
          <SelectItem value="full_day">Full Day Service</SelectItem>
          <SelectItem value="multi_day">Multi-Day Service</SelectItem>
          <SelectItem value="round_trip">Round Trip</SelectItem>
          <SelectItem value="security_escort">Security Escort</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
