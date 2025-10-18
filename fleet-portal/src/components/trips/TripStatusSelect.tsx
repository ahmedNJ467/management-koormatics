
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripStatus } from "@/lib/types/trip";

interface TripStatusSelectProps {
  status: TripStatus;
  onChange: (value: TripStatus) => void;
  disabled?: boolean;
}

export function TripStatusSelect({ status, onChange, disabled = false }: TripStatusSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select
        value={status}
        onValueChange={(value) => onChange(value as TripStatus)}
        disabled={disabled}
      >
        <SelectTrigger id="status" className="w-full">
          <SelectValue placeholder="Select a status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
