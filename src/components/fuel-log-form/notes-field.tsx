
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { fuelLogSchema } from "./use-fuel-log-form";

type NotesFieldProps = {
  form: UseFormReturn<z.infer<typeof fuelLogSchema>>;
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
