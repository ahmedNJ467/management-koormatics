
import { useState } from "react";
import { useCostAnalyticsData } from "./use-cost-analytics-data";
import { useReportsData } from "@/components/reports/hooks/useReportsData";
import { calculateCombinedFinancialData } from "@/lib/financial-analytics";

export function useCombinedFinancialData() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get cost analytics data
  const { 
    maintenanceData, 
    fuelData, 
    comparisonMaintenanceData, 
    comparisonFuelData,
    isLoading: isLoadingCosts, 
    yearOptions,
    comparisonYear,
    setComparisonYear
  } = useCostAnalyticsData(selectedYear);
  
  // Get revenue data from reports
  const { 
    tripsData,
    isLoadingTrips
  } = useReportsData();
  
  // Filter trips data by selected year
  const filteredTrips = tripsData?.filter(trip => {
    if (!trip.date) return false;
    const tripYear = new Date(trip.date).getFullYear().toString();
    return tripYear === selectedYear;
  }) || [];
  
  // Calculate combined financial data
  const combinedData = calculateCombinedFinancialData(
    filteredTrips, 
    maintenanceData, 
    fuelData, 
    comparisonMaintenanceData, 
    comparisonFuelData,
    selectedYear,
    comparisonYear
  );
  
  const isLoading = isLoadingCosts || isLoadingTrips;
  
  return {
    combinedData,
    isLoading,
    selectedYear,
    setSelectedYear,
    activeTab,
    setActiveTab,
    yearOptions,
    comparisonYear,
    setComparisonYear
  };
}
