
import { useState } from "react";
import { DateRange } from "react-day-picker";

export function useReportFilters() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [timeRange, setTimeRange] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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

  return {
    activeTab,
    setActiveTab,
    timeRange,
    setTimeRange,
    dateRange,
    setDateRange,
    handleDateRangeChange,
    clearDateRange
  };
}
