import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { Client, Driver, Vehicle } from "@/lib/types";
import { serviceTypeOptions } from "@/lib/types/trip/base-types";
import { RecurringTripFields } from "@/components/trips/RecurringTripFields";
import { FlightDetailsFields } from "@/components/trips/FlightDetailsFields";
import { TripStatusSelect } from "@/components/trips/TripStatusSelect";

interface TripFormProps {
  tripData?: DisplayTrip;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStatus?: (tripId: string, status: TripStatus) => void;
}

export function TripForm({
  tripData,
  clients,
  vehicles,
  drivers,
  onSubmit,
  updateStatus,
}: TripFormProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<string>(
    tripData?.service_type || tripData?.type || "point_to_point"
  );
  
  const [selectedClientId, setSelectedClientId] = useState<string>(
    tripData?.client_id || ""
  );
  
  const [isRecurring, setIsRecurring] = useState<boolean>(
    tripData?.is_recurring || false
  );

  // Additional state for selected client type
  const [selectedClientType, setSelectedClientType] = useState<"organization" | "individual" | undefined>(
    clients?.find(c => c.id === selectedClientId)?.type
  );

  // Update client type when client selection changes
  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients?.find(c => c.id === selectedClientId);
      setSelectedClientType(selectedClient?.type);
    } else {
      setSelectedClientType(undefined);
    }
  }, [selectedClientId, clients]);
  
  // Determine if we need to show return time field
  const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(selectedServiceType);
  
  // Determine if we need to show flight details
  const needsFlightDetails = ["airport_pickup", "airport_dropoff"].includes(selectedServiceType);
  
  // Format date for input field
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return "";
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Trip Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type">Service Type</Label>
        <Select
          name="service_type"
          value={selectedServiceType}
          onValueChange={(value) => setSelectedServiceType(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Selection */}
      <div className="space-y-2">
        <Label htmlFor="client_id">Client</Label>
        <Select
          name="client_id"
          value={selectedClientId}
          onValueChange={(value) => setSelectedClientId(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.type === "organization" && "(Organization)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="client_type" value={selectedClientType || ""} />
      </div>

      {/* Passengers Field for Organization Clients */}
      {selectedClientType === "organization" && (
        <div className="space-y-2">
          <Label htmlFor="passengers">Passengers</Label>
          <Textarea
            name="passengers"
            placeholder="Enter passenger names (one per line)"
            className="h-24"
            defaultValue={tripData?.passengers?.join('\n') || ''}
          />
          <p className="text-xs text-muted-foreground">
            Enter each passenger name on a new line
          </p>
        </div>
      )}

      {/* Vehicle Selection */}
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <Select
          name="vehicle_id"
          defaultValue={tripData?.vehicle_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles?.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.registration})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Driver Selection */}
      <div className="space-y-2">
        <Label htmlFor="driver_id">Driver</Label>
        <Select
          name="driver_id"
          defaultValue={tripData?.driver_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers?.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            name="date"
            defaultValue={formatDateForInput(tripData?.date)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            type="time"
            name="time"
            defaultValue={tripData?.time || tripData?.start_time || ""}
            required
          />
        </div>
      </div>

      {/* Return Time (for round trips) */}
      {needsReturnTime && (
        <div className="space-y-2">
          <Label htmlFor="return_time">Return Time</Label>
          <Input
            type="time"
            name="return_time"
            defaultValue={tripData?.return_time || tripData?.end_time || ""}
          />
        </div>
      )}

      {/* Pickup and Dropoff Locations */}
      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          name="pickup_location"
          placeholder="Enter pickup address"
          defaultValue={tripData?.pickup_location || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input
          name="dropoff_location"
          placeholder="Enter dropoff address"
          defaultValue={tripData?.dropoff_location || ""}
        />
      </div>

      {/* Flight Details for Airport Trips */}
      {needsFlightDetails && (
        <FlightDetailsFields
          flightNumber={tripData?.flight_number || ""}
          airline={tripData?.airline || ""}
          terminal={tripData?.terminal || ""}
        />
      )}

      {/* Special Notes */}
      <div className="space-y-2">
        <Label htmlFor="special_notes">Notes</Label>
        <Textarea
          name="special_notes"
          placeholder="Add any special instructions or notes"
          className="h-24"
          defaultValue={tripData?.notes || tripData?.special_notes || ""}
        />
      </div>

      {/* Status Field (only for editing) */}
      {tripData && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <TripStatusSelect
            name="status"
            defaultValue={tripData.status}
            tripId={tripData.id}
            updateStatus={updateStatus}
          />
        </div>
      )}

      {/* Recurring Trip Option (only for new trips) */}
      {!tripData && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_recurring"
            name="is_recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
          />
          <Label htmlFor="is_recurring" className="cursor-pointer">
            This is a recurring trip
          </Label>
        </div>
      )}

      {/* Recurring Trip Fields */}
      {!tripData && isRecurring && (
        <RecurringTripFields />
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full">
        {tripData ? "Update Trip" : "Book Trip"}
      </Button>
    </form>
  );
}
