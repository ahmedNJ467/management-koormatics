
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";

export function FlightDetailsFields() {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Flight Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="airline">Airline</Label>
          <Input
            id="airline"
            {...register("airline")}
            placeholder="e.g. Delta Airlines"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="flight_number">Flight Number</Label>
          <Input
            id="flight_number"
            {...register("flight_number")}
            placeholder="e.g. DL1234"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terminal">Terminal</Label>
          <Input
            id="terminal"
            {...register("terminal")}
            placeholder="e.g. Terminal 5"
          />
        </div>
      </div>
    </div>
  );
}
