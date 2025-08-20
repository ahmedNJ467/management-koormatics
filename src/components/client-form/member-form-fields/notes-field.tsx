
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NotesFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function NotesField({ value, onChange }: NotesFieldProps) {
  return (
    <div className="col-span-2 space-y-2">
      <Label>Notes</Label>
      <Textarea
        value={value || ""}
        onChange={onChange}
        rows={3}
      />
    </div>
  );
}
