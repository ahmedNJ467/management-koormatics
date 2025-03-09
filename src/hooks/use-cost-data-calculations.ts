
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
  sparePartsData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  comparisonSparePartsData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
) {
  // Generate all the calculated data at once
  const summaryCosts = calculateSummaryCosts(maintenanceData, fuelData, sparePartsData);
  const monthlyData = calculateMonthlyData(maintenanceData, fuelData, sparePartsData);
  const vehicleCosts = calculateVehicleCosts(maintenanceData, fuelData, sparePartsData);
  const maintenanceCategories = calculateMaintenanceCategories(maintenanceData);
  const fuelTypes = calculateFuelTypes(fuelData);
  const yearComparison = calculateYearComparison(
    maintenanceData, 
    fuelData, 
    sparePartsData,
    comparisonMaintenanceData, 
    comparisonFuelData, 
    comparisonSparePartsData,
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
