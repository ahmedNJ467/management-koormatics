import { Label } from "@/components/ui/label";
import { DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";

interface DateTimeFieldsProps {
  editTrip: DisplayTrip | null;
  serviceType: UIServiceType;
  onDateTimeChange?: (field: "date" | "time", value: string) => void;
}

export function DateTimeFields({
  editTrip,
  serviceType,
  onDateTimeChange,
}: DateTimeFieldsProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [returnTime, setReturnTime] = useState<string | undefined>();

  useEffect(() => {
    if (editTrip) {
      if (editTrip.date) {
        try {
          // Handle both 'YYYY-MM-DD' and full ISO strings
          const dateString = editTrip.date.split("T")[0];
          setDate(parseISO(dateString));
        } catch (e) {
          console.error(
            "Invalid date format from editTrip.date:",
            editTrip.date
          );
          const dateObj = new Date(editTrip.date);
          if (!isNaN(dateObj.getTime())) {
            setDate(dateObj);
          }
        }
      } else {
        setDate(undefined);
      }
      setTime(editTrip.time || editTrip.start_time);
      setReturnTime(editTrip.return_time || editTrip.end_time);
    } else {
      setDate(undefined);
      setTime(undefined);
      setReturnTime(undefined);
    }
  }, [editTrip]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (onDateTimeChange) {
      if (newDate) {
        onDateTimeChange("date", format(newDate, "yyyy-MM-dd"));
      } else {
        onDateTimeChange("date", "");
      }
    }
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (onDateTimeChange) {
      onDateTimeChange("time", newTime || "");
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DatePicker date={date} onDateChange={handleDateChange} />
          <input
            type="hidden"
            name="date"
            value={date ? format(date, "yyyy-MM-dd") : ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={time || ""}
            onChange={handleTimeInputChange}
            className="h-11"
            step={60}
            required
          />
          <input type="hidden" id="time" name="time" value={time || ""} required />
        </div>
      </div>

      {["round_trip", "security_escort", "full_day_hire"].includes(
        serviceType
      ) && (
        <div className="space-y-2">
          <Label htmlFor="return_time">Return Time</Label>
          <Input
            id="return_time"
            type="time"
            value={returnTime || ""}
            onChange={(e) => setReturnTime(e.target.value)}
            className="h-11"
            step={60}
          />
          <input type="hidden" id="return_time" name="return_time" value={returnTime || ""} />
        </div>
      )}
    </>
  );
}
