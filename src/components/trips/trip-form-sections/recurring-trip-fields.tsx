
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurringTripFieldsProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
}

export function RecurringTripFields({ isRecurring, setIsRecurring }: RecurringTripFieldsProps) {
  return (
    <>
      <Separator />
      <div className="flex items-center space-x-2">
        <Switch
          id="is_recurring"
          name="is_recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
        <Label htmlFor="is_recurring">Recurring Booking</Label>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select name="frequency" defaultValue="weekly">
              <SelectTrigger>
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
              name="occurrences"
              type="number"
              min="1"
              defaultValue="4"
            />
          </div>
        </div>
      )}
    </>
  );
}
