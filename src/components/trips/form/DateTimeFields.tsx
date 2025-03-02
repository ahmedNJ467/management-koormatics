
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";

interface DateTimeFieldsProps {
  editTrip: DisplayTrip | null;
  serviceType: UIServiceType;
}

export function DateTimeFields({ editTrip, serviceType }: DateTimeFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date"
            name="date"
            type="date"
            defaultValue={editTrip?.date}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input 
            id="time"
            name="time"
            type="time"
            defaultValue={editTrip?.time || editTrip?.start_time}
            required
          />
        </div>
      </div>

      {["round_trip", "security_escort", "full_day_hire"].includes(serviceType) && (
        <div className="space-y-2">
          <Label htmlFor="return_time">Return Time</Label>
          <Input 
            id="return_time"
            name="return_time"
            type="time"
            defaultValue={editTrip?.return_time || editTrip?.end_time}
          />
        </div>
      )}
    </>
  );
}
