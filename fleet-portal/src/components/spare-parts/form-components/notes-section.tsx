
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";

interface NotesSectionProps {
  form: UseFormReturn<z.infer<typeof PartFormSchema>>;
}

export const NotesSection = ({ form }: NotesSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Additional Notes</h3>
      
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter any additional information about this part (optional)"
                {...field}
                className="min-h-[80px] resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
