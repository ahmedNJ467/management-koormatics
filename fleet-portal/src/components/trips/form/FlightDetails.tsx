
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FlightDetailsProps } from "./types";

export function FlightDetails({ serviceType, editTrip }: FlightDetailsProps) {
  if (serviceType !== "airport_pickup" && serviceType !== "airport_dropoff") {
    return null;
  }

  return (
    <div className="border p-4 rounded-md space-y-4">
      <h3 className="text-sm font-medium">Flight Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="flight_number">Flight Number</Label>
          <Input 
            id="flight_number"
            name="flight_number"
            placeholder="e.g. BA123"
            defaultValue={editTrip?.flight_number || ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="airline">Airline</Label>
          <Input 
            id="airline"
            name="airline"
            placeholder="e.g. British Airways"
            defaultValue={editTrip?.airline || ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="terminal">Terminal</Label>
          <Input 
            id="terminal"
            name="terminal"
            placeholder="e.g. Terminal 5"
            defaultValue={editTrip?.terminal || ""}
          />
        </div>
      </div>
    </div>
  );
}
