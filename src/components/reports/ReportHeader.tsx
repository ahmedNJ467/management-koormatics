
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Calendar, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ReportProps } from "./types";

interface ReportHeaderProps extends ReportProps {
  title: string;
}

export const ReportHeader = ({ 
  title, 
  timeRange, 
  dateRange, 
  setTimeRange, 
  setDateRange 
}: ReportHeaderProps) => {
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range && range.from) {
      setTimeRange("custom");
    }
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    setTimeRange("month");
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex items-center gap-4">
        <Select 
          value={timeRange} 
          onValueChange={(value) => {
            setTimeRange(value);
            if (value !== "custom") {
              setDateRange(undefined);
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
};
