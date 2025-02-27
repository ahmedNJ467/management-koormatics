
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Client, Driver, Trip, Vehicle, TripStatus, TripType } from "@/lib/types";

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

  // Get appropriate form fields based on service type
  const getFormFields = () => {
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
                  defaultValue={initialTrip?.airline || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  name="flight_number"
                  defaultValue={initialTrip?.flight_number || ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminal">Terminal</Label>
              <Input
                id="terminal"
                name="terminal"
                defaultValue={initialTrip?.terminal || ""}
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
              defaultValue={initialTrip?.hours || "1"}
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
              defaultValue={initialTrip?.days || "1"}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service_type">Service Type</Label>
        <Select
          name="service_type"
          value={serviceType}
          onValueChange={(value) => setServiceType(value as UIServiceType)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <input
            type="hidden"
            name="date"
            value={date ? format(date, "yyyy-MM-dd") : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={
              initialTrip?.start_time ||
              format(new Date().setHours(9, 0), "HH:mm")
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_id">Client</Label>
        <Select name="client_id" defaultValue={initialTrip?.client_id}>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle_id">Vehicle</Label>
          <Select name="vehicle_id" defaultValue={initialTrip?.vehicle_id}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.registration})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver_id">Driver</Label>
          <Select name="driver_id" defaultValue={initialTrip?.driver_id}>
            <SelectTrigger>
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          id="pickup_location"
          name="pickup_location"
          defaultValue={initialTrip?.pickup_location || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input
          id="dropoff_location"
          name="dropoff_location"
          defaultValue={initialTrip?.dropoff_location || ""}
        />
      </div>

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

      {getFormFields()}

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

      {!initialTrip && (
        <>
          <Separator />
          <div className="flex items-center space-x-2">
            <Switch
              id="is_recurring"
              name="is_recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="is_recurring">Recurring Booking</Label>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select name="frequency" defaultValue="weekly">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurrences">Number of Occurrences</Label>
                <Input
                  id="occurrences"
                  name="occurrences"
                  type="number"
                  min="1"
                  defaultValue="4"
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="special_notes">Special Notes</Label>
        <Textarea
          id="special_notes"
          name="special_notes"
          defaultValue={initialTrip?.notes || ""}
          placeholder="Enter any special requirements or notes for this trip"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialTrip ? "Update Trip" : "Book Trip"}
        </Button>
      </div>
    </form>
  );
}
