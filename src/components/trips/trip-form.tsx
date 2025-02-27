
import React, { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Client, Driver, Trip, Vehicle, TripStatus, TripType } from "@/lib/types";

// Import the form section components
import { ServiceTypeField } from "./trip-form-sections/service-type-field";
import { DateTimeFields } from "./trip-form-sections/date-time-fields";
import { ClientSelection } from "./trip-form-sections/client-selection";
import { VehicleDriverFields } from "./trip-form-sections/vehicle-driver-fields";
import { LocationFields } from "./trip-form-sections/location-fields";
import { ServiceSpecificFields } from "./trip-form-sections/service-specific-fields";
import { RecurringTripFields } from "./trip-form-sections/recurring-trip-fields";

// Define service types for UI
export type UIServiceType =
  | "airport_pickup"
  | "airport_dropoff"
  | "hourly"
  | "full_day"
  | "multi_day"
  | "round_trip"
  | "security_escort";

// Map UI service types to database trip types
export const serviceTypeMap: { [key in UIServiceType]: TripType } = {
  airport_pickup: "airport_pickup",
  airport_dropoff: "airport_dropoff",
  hourly: "hourly",
  full_day: "full_day",
  multi_day: "multi_day",
  round_trip: "other", // Map to 'other' in the database
  security_escort: "other", // Map to 'other' in the database
};

// Map database trip types to UI service types
export const dbServiceTypeMap: { [key in TripType]: UIServiceType } = {
  airport_pickup: "airport_pickup",
  airport_dropoff: "airport_dropoff",
  hourly: "hourly",
  full_day: "full_day",
  multi_day: "multi_day",
  other: "round_trip", // Default mapping for 'other'
};

// Extended Trip type for additional UI fields
interface ExtendedTrip extends Trip {
  airline?: string;
  flight_number?: string;
  terminal?: string;
  hours?: string | number;
  days?: string | number;
}

interface TripFormProps {
  clients: Client[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSubmit: (formData: FormData) => Promise<void>;
  initialTrip?: ExtendedTrip | null;
  isSubmitting: boolean;
}

export function TripForm({
  clients,
  vehicles,
  drivers,
  onSubmit,
  initialTrip = null,
  isSubmitting,
}: TripFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    initialTrip?.date ? new Date(initialTrip.date) : new Date()
  );
  const [isRecurring, setIsRecurring] = useState(false);

  // Initialize service type from initialTrip or default
  const [serviceType, setServiceType] = useState<UIServiceType>(
    initialTrip?.type
      ? dbServiceTypeMap[initialTrip.type as TripType]
      : "round_trip"
  );

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Service Type Selection */}
      <ServiceTypeField value={serviceType} onChange={setServiceType} />

      {/* Date and Time Fields */}
      <DateTimeFields 
        date={date} 
        setDate={setDate} 
        defaultTime={
          initialTrip?.start_time ||
          format(new Date().setHours(9, 0), "HH:mm")
        } 
      />

      {/* Client Selection */}
      <ClientSelection clients={clients} defaultValue={initialTrip?.client_id} />

      {/* Vehicle and Driver Fields */}
      <VehicleDriverFields 
        vehicles={vehicles} 
        drivers={drivers} 
        defaultVehicleId={initialTrip?.vehicle_id} 
        defaultDriverId={initialTrip?.driver_id} 
      />

      {/* Location Fields */}
      <LocationFields 
        defaultPickup={initialTrip?.pickup_location || ""} 
        defaultDropoff={initialTrip?.dropoff_location || ""} 
      />

      {/* Return Time Field (for round trips) */}
      {serviceType === "round_trip" && (
        <div className="space-y-2">
          <Label htmlFor="return_time">Return Time</Label>
          <Input
            id="return_time"
            name="return_time"
            type="time"
            defaultValue={initialTrip?.end_time || ""}
          />
        </div>
      )}

      {/* Service-Specific Fields */}
      <ServiceSpecificFields 
        serviceType={serviceType} 
        initialValues={{
          airline: initialTrip?.airline,
          flight_number: initialTrip?.flight_number,
          terminal: initialTrip?.terminal,
          hours: initialTrip?.hours,
          days: initialTrip?.days,
        }} 
      />

      {/* Status Field (for editing existing trips) */}
      {initialTrip && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status" 
            defaultValue={initialTrip?.status || "scheduled"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Recurring Trip Fields (for new trips only) */}
      {!initialTrip && (
        <RecurringTripFields 
          isRecurring={isRecurring} 
          setIsRecurring={setIsRecurring} 
        />
      )}

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="special_notes">Special Notes</Label>
        <Textarea
          id="special_notes"
          name="special_notes"
          defaultValue={initialTrip?.notes || ""}
          placeholder="Enter any special requirements or notes for this trip"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialTrip ? "Update Trip" : "Book Trip"}
        </Button>
      </div>
    </form>
  );
}
