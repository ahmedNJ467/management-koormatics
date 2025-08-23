
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export function filterDataByDate(data: any[] | undefined, timeRange: string, dateRange: DateRange | undefined): any[] {
  if (!data) return [];
  
  if (dateRange && dateRange.from) {
    const fromDate = dateRange.from;
    const toDate = dateRange.to || new Date();
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= fromDate && itemDate <= toDate;
    });
  } 
  
  if (timeRange === "all") return data;
  
  const now = new Date();
  let cutoffDate = new Date();
  
  if (timeRange === "month") {
    cutoffDate.setMonth(now.getMonth() - 1);
  } else if (timeRange === "quarter") {
    cutoffDate.setMonth(now.getMonth() - 3);
  } else if (timeRange === "year") {
    cutoffDate.setFullYear(now.getFullYear() - 1);
  }
  
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
}
