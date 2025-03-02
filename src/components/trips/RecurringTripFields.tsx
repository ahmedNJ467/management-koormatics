
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export function RecurringTripFields() {
  const { register, watch, setValue } = useFormContext();
  const isRecurring = watch("is_recurring");
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select
            defaultValue="weekly"
            onValueChange={(value) => setValue("frequency", value)}
            disabled={!isRecurring}
          >
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurrences">Number of Occurrences</Label>
          <Input
            id="occurrences"
            type="number"
            min="2"
            defaultValue="4"
            {...register("occurrences", { valueAsNumber: true })}
            disabled={!isRecurring}
          />
        </div>
      </div>
    </div>
  );
}
