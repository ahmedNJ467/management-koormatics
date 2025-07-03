import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModernTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ModernTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
}: ModernTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string>("");
  const [selectedMinute, setSelectedMinute] = React.useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = React.useState<"AM" | "PM">("AM");

  // Parse the value when it changes
  React.useEffect(() => {
    if (value) {
      const [time, period] = value.split(" ");
      if (time) {
        const [hour, minute] = time.split(":");
        if (hour && minute) {
          setSelectedHour(hour);
          setSelectedMinute(minute);
          if (period) {
            setSelectedPeriod(period as "AM" | "PM");
          } else {
            // If no period is provided, determine it from 24-hour format
            const hourNum = parseInt(hour);
            if (hourNum >= 12) {
              setSelectedPeriod("PM");
              if (hourNum > 12) {
                setSelectedHour((hourNum - 12).toString().padStart(2, "0"));
              }
            } else {
              setSelectedPeriod("AM");
              if (hourNum === 0) {
                setSelectedHour("12");
              }
            }
          }
        }
      }
    }
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const handleTimeSelect = (
    hour: string,
    minute: string,
    period: "AM" | "PM"
  ) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);

    // Convert to 24-hour format for storage
    let hour24 = parseInt(hour);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const formattedTime = `${hour24.toString().padStart(2, "0")}:${minute}`;
    onChange?.(formattedTime);
    setOpen(false);
  };

  const displayValue = React.useMemo(() => {
    if (selectedHour && selectedMinute) {
      return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    }
    return "";
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // Quick time options
  const quickTimes = [
    {
      label: "Morning",
      times: ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM"],
    },
    {
      label: "Midday",
      times: ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM"],
    },
    {
      label: "Afternoon",
      times: ["02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
    },
    {
      label: "Evening",
      times: ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"],
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !displayValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {displayValue || placeholder}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-4">Select Time</h4>

          {/* Quick time selection */}
          <div className="space-y-3 mb-4">
            {quickTimes.map((group) => (
              <div key={group.label}>
                <p className="text-xs text-muted-foreground mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {group.times.map((time) => {
                    const [timeStr, period] = time.split(" ");
                    const [hour, minute] = timeStr.split(":");
                    return (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          handleTimeSelect(hour, minute, period as "AM" | "PM")
                        }
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Custom Time</p>
            <div className="flex gap-2">
              {/* Hour selector */}
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Hour</label>
                <ScrollArea className="h-32 mt-1 border rounded-md">
                  <div className="p-1">
                    {hours.map((hour) => (
                      <Button
                        key={hour}
                        variant={selectedHour === hour ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-center mb-1 text-sm"
                        onClick={() => setSelectedHour(hour)}
                      >
                        {hour}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Minute selector */}
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Minute</label>
                <ScrollArea className="h-32 mt-1 border rounded-md">
                  <div className="p-1">
                    {minutes
                      .filter((_, i) => i % 5 === 0)
                      .map((minute) => (
                        <Button
                          key={minute}
                          variant={
                            selectedMinute === minute ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-center mb-1 text-sm"
                          onClick={() => setSelectedMinute(minute)}
                        >
                          {minute}
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
              </div>

              {/* AM/PM selector */}
              <div>
                <label className="text-xs text-muted-foreground">Period</label>
                <div className="mt-1 space-y-1">
                  <Button
                    variant={selectedPeriod === "AM" ? "secondary" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedPeriod("AM")}
                  >
                    AM
                  </Button>
                  <Button
                    variant={selectedPeriod === "PM" ? "secondary" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedPeriod("PM")}
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>

            {/* Apply button */}
            <Button
              className="w-full mt-4"
              onClick={() => {
                if (selectedHour && selectedMinute) {
                  handleTimeSelect(
                    selectedHour,
                    selectedMinute,
                    selectedPeriod
                  );
                }
              }}
              disabled={!selectedHour || !selectedMinute}
            >
              Apply Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
