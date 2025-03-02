
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Driver, Vehicle } from "@/lib/types";
import { UIServiceType } from "./types";
import { DisplayTrip } from "@/lib/types/trip";

interface SelectsProps {
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  editTrip: DisplayTrip | null;
  selectedClientId: string;
  serviceType: UIServiceType;
  handleClientChange: (clientId: string) => void;
  setServiceType: (value: UIServiceType) => void;
}

export function ClientVehicleDriverSelects({
  clients,
  vehicles,
  drivers,
  editTrip,
  selectedClientId,
  serviceType,
  handleClientChange,
  setServiceType
}: SelectsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="client_id">Client</Label>
        <Select 
          name="client_id" 
          defaultValue={editTrip?.client_id} 
          onValueChange={handleClientChange}
          required
        >
          <SelectTrigger id="client_id">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.type === "organization" && "🏢"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_type">Service Type</Label>
        <Select 
          name="service_type" 
          value={serviceType}
          onValueChange={(value: string) => setServiceType(value as UIServiceType)}
          required
        >
          <SelectTrigger id="service_type">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
            <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
            <SelectItem value="one_way">One Way Transfer</SelectItem>
            <SelectItem value="round_trip">Round Trip</SelectItem>
            <SelectItem value="full_day_hire">Full Day Hire</SelectItem>
            <SelectItem value="security_escort">Security Escort</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function VehicleDriverSelects({
  vehicles,
  drivers,
  editTrip
}: {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  editTrip: DisplayTrip | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
          <SelectTrigger id="vehicle_id">
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

      <div className="space-y-2">
        <Label htmlFor="driver_id">Driver</Label>
        <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
          <SelectTrigger id="driver_id">
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
    </div>
  );
}
