
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";

type NotesFieldProps = {
  form: UseFormReturn<FuelLogFormValues>;
};

export function NotesField({ form }: NotesFieldProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea placeholder="Any additional notes about this fuel log..." {...field} value={field.value || ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
