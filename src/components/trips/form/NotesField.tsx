
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DisplayTrip } from "@/lib/types/trip";

interface NotesFieldProps {
  editTrip: DisplayTrip | null;
}

export function NotesField({ editTrip }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="special_notes">Notes</Label>
      <Textarea 
        id="special_notes"
        name="special_notes"
        placeholder="Add any special instructions or notes"
        defaultValue={editTrip?.notes || ""}
        className="min-h-[80px]"
      />
    </div>
  );
}
