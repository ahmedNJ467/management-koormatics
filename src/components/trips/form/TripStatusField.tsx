import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DisplayTrip } from "@/lib/types/trip";

interface TripStatusFieldProps {
  editTrip: DisplayTrip | null;
}

export function TripStatusField({ editTrip }: TripStatusFieldProps) {
  if (!editTrip) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select name="status" defaultValue={editTrip.status} required>
        <SelectTrigger id="status">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="in_progress" disabled>
            In Progress (use Dispatch)
          </SelectItem>
          <SelectItem value="completed" disabled>
            Completed (use Dispatch)
          </SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
