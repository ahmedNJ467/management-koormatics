
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/lib/types";
import { UIServiceType } from "./types";
import { DisplayTrip } from "@/lib/types/trip";

interface SelectsProps {
  clients?: Client[];
  editTrip: DisplayTrip | null;
  selectedClientId: string;
  serviceType: UIServiceType;
  handleClientChange: (clientId: string) => void;
  setServiceType: (value: UIServiceType) => void;
}

export function ClientVehicleDriverSelects({
  clients,
  editTrip,
  selectedClientId,
  serviceType,
  handleClientChange,
  setServiceType,
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
