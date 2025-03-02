
import { 
  CostData,
  MonthlyData,
  VehicleCostData,
  CategoryData,
  YearComparisonData
} from "@/lib/types/cost-analytics";

import {
  calculateSummaryCosts,
  calculateMonthlyData,
  calculateVehicleCosts,
  calculateMaintenanceCategories,
  calculateFuelTypes,
  calculateYearComparison
} from "@/lib/cost-analytics";

export function useCostDataCalculations(
  maintenanceData: any[] = [], 
  fuelData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
) {
  // Generate all the calculated data at once
  const summaryCosts = calculateSummaryCosts(maintenanceData, fuelData);
  const monthlyData = calculateMonthlyData(maintenanceData, fuelData);
  const vehicleCosts = calculateVehicleCosts(maintenanceData, fuelData);
  const maintenanceCategories = calculateMaintenanceCategories(maintenanceData);
  const fuelTypes = calculateFuelTypes(fuelData);
  const yearComparison = calculateYearComparison(
    maintenanceData, 
    fuelData, 
    comparisonMaintenanceData, 
    comparisonFuelData, 
    selectedYear, 
    comparisonYear
  );

  return {
    summaryCosts,
    monthlyData,
    vehicleCosts,
    maintenanceCategories,
    fuelTypes,
    yearComparison
  };
}
