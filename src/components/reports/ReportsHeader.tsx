
import { Calendar, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ReportsHeaderProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  dateRange: DateRange | undefined;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  clearDateRange: () => void;
}

export function ReportsHeader({
  timeRange,
  setTimeRange,
  dateRange,
  handleDateRangeChange,
  clearDateRange
}: ReportsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Management Reports</h1>
        <p className="text-muted-foreground mt-1">Koormatics Fleet Management System</p>
      </div>
      <div className="flex items-center gap-4">
        <Select 
          value={timeRange} 
          onValueChange={(value) => {
            setTimeRange(value);
            if (value !== "custom") {
              handleDateRangeChange(undefined);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        
        {timeRange === "custom" && (
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <Button variant="outline" size="icon" onClick={clearDateRange}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
