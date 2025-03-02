
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTabs } from "@/components/reports/ReportTabs";
import { 
  useFuelData, 
  useMaintenanceData, 
  useTripsData 
} from "@/components/reports/hooks/useReportData";
import { 
  calculateTotalFuelCost, 
  calculateTotalMaintenanceCost, 
  calculateTotalTripRevenue 
} from "@/components/reports/utils/export-utils";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: fuelData, isLoading: isLoadingFuel } = useFuelData(timeRange, dateRange);
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useMaintenanceData(timeRange, dateRange);
  const { data: tripsData, isLoading: isLoadingTrips } = useTripsData(timeRange, dateRange);

  const totalFuelCost = calculateTotalFuelCost(fuelData || []).toFixed(2);
  const totalMaintenanceCost = calculateTotalMaintenanceCost(maintenanceData || []).toFixed(2);
  const totalTripRevenue = calculateTotalTripRevenue(tripsData || []).toFixed(2);

  return (
    <div className="container py-6 space-y-6">
      <ReportHeader 
        title="Reports" 
        timeRange={timeRange} 
        dateRange={dateRange} 
        setTimeRange={setTimeRange} 
        setDateRange={setDateRange} 
      />

      <ReportSummaryCards 
        fuelCost={totalFuelCost}
        maintenanceCost={totalMaintenanceCost}
        tripRevenue={totalTripRevenue}
        isLoadingFuel={isLoadingFuel}
        isLoadingMaintenance={isLoadingMaintenance}
        isLoadingTrips={isLoadingTrips}
      />

      <ReportTabs 
        timeRange={timeRange} 
        dateRange={dateRange} 
        setTimeRange={setTimeRange} 
        setDateRange={setDateRange} 
      />
    </div>
  );
};

export default Reports;
