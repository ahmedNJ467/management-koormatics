
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  date?: DateRange
  onChange?: (date: DateRange | undefined) => void
  onDateChange?: (date: DateRange | undefined) => void
  className?: string
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
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
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
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={actualValue?.from}
            selected={actualValue}
            onSelect={actualOnChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
