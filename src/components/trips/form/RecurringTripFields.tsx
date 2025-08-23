
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringTripProps } from "./types";

export function RecurringTripFields({ 
  isRecurring, 
  setIsRecurring, 
  frequency, 
  setFrequency 
}: RecurringTripProps) {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is_recurring" 
          name="is_recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setIsRecurring(checked === true)}
        />
        <Label htmlFor="is_recurring" className="cursor-pointer">This is a recurring trip</Label>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
          <div className="space-y-2">
            <Label htmlFor="occurrences">Number of Occurrences</Label>
            <Input 
              id="occurrences"
              name="occurrences"
              type="number"
              defaultValue="4"
              min="2"
              required={isRecurring}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select 
              name="frequency" 
              value={frequency}
              onValueChange={(value) => setFrequency(value as "daily" | "weekly" | "monthly")}
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
        </div>
      )}
    </>
  );
}
