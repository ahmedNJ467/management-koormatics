
import { YearComparisonData } from '@/lib/types/cost-analytics';

export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateYearComparison(
  maintenanceData: any[] = [], 
  fuelData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
): YearComparisonData | null {
  if (!comparisonYear || !selectedYear) {
    return null;
  }

  // Ensure we have valid arrays, even if empty
  const currentMaintenanceData = Array.isArray(maintenanceData) ? maintenanceData : [];
  const currentFuelData = Array.isArray(fuelData) ? fuelData : [];
  const prevMaintenanceData = Array.isArray(comparisonMaintenanceData) ? comparisonMaintenanceData : [];
  const prevFuelData = Array.isArray(comparisonFuelData) ? comparisonFuelData : [];

  const currentCosts = {
    maintenance: currentMaintenanceData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    fuel: currentFuelData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    total: 0
  };
  currentCosts.total = currentCosts.maintenance + currentCosts.fuel;

  const previousCosts = {
    maintenance: prevMaintenanceData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    fuel: prevFuelData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    total: 0
  };
  previousCosts.total = previousCosts.maintenance + previousCosts.fuel;

  return {
    currentYear: selectedYear,
    previousYear: comparisonYear,
    maintenance: {
      current: currentCosts.maintenance,
      previous: previousCosts.maintenance,
      percentChange: calculatePercentChange(currentCosts.maintenance, previousCosts.maintenance)
    },
    fuel: {
      current: currentCosts.fuel,
      previous: previousCosts.fuel,
      percentChange: calculatePercentChange(currentCosts.fuel, previousCosts.fuel)
    },
    total: {
      current: currentCosts.total,
      previous: previousCosts.total,
      percentChange: calculatePercentChange(currentCosts.total, previousCosts.total)
    }
  };
}
