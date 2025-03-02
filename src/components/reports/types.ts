
import { DateRange } from "react-day-picker";

export interface TabProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export interface ReportProps {
  timeRange: string;
  dateRange: DateRange | undefined;
  setTimeRange: (range: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
}
