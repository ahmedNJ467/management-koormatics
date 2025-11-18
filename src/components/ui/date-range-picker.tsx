import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRangePickerProps {
  value?: DateRange;
  date?: DateRange;
  onChange?: (date: DateRange | undefined) => void;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  date,
  onChange,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const actualValue = value || date;
  const actualOnChange = onChange || onDateChange;
  const isMobile = useIsMobile();
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !actualValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {actualValue?.from ? (
              actualValue.to ? (
                <>
                  {format(actualValue.from, "LLL dd, y")} -{" "}
                  {format(actualValue.to, "LLL dd, y")}
                </>
              ) : (
                format(actualValue.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 max-w-[calc(100vw-2rem)]"
          align="start"
          side="bottom"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={actualValue?.from}
            selected={actualValue}
            onSelect={actualOnChange}
            numberOfMonths={isMobile ? 1 : 2}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={new Date().getFullYear() + 10}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
