
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UIServiceType } from "../trip-form";

interface ServiceSpecificFieldsProps {
  serviceType: UIServiceType;
  initialValues?: {
    airline?: string;
    flight_number?: string;
    terminal?: string;
    hours?: string | number;
    days?: string | number;
  };
}

export function ServiceSpecificFields({ serviceType, initialValues = {} }: ServiceSpecificFieldsProps) {
  switch (serviceType) {
    case "airport_pickup":
    case "airport_dropoff":
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airline">Airline</Label>
              <Input
                id="airline"
                name="airline"
                defaultValue={initialValues.airline || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight_number">Flight Number</Label>
              <Input
                id="flight_number"
                name="flight_number"
                defaultValue={initialValues.flight_number || ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="terminal">Terminal</Label>
            <Input
              id="terminal"
              name="terminal"
              defaultValue={initialValues.terminal || ""}
            />
          </div>
        </>
      );
    case "hourly":
      return (
        <div className="space-y-2">
          <Label htmlFor="hours">Number of Hours</Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            min="1"
            defaultValue={initialValues.hours || "1"}
          />
        </div>
      );
    case "full_day":
    case "multi_day":
      return (
        <div className="space-y-2">
          <Label htmlFor="days">Number of Days</Label>
          <Input
            id="days"
            name="days"
            type="number"
            min="1"
            defaultValue={initialValues.days || "1"}
          />
        </div>
      );
    default:
      return null;
  }
}
