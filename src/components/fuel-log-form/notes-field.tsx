
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";

type NotesFieldProps = {
  form: UseFormReturn<FuelLogFormValues>;
};

export function NotesField({ form }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        {...form.register("notes")}
      />
    </div>
  );
}
