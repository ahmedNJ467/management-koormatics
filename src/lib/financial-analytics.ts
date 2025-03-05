
import { 
  CostData,
  MonthlyData,
  VehicleCostData,
  CategoryData,
  YearComparisonData
} from "./types/cost-analytics";
import { calculateFinancialData, FinancialData } from "./financial-calculations";

export type CombinedFinancialData = {
  costAnalytics: {
    summaryCosts: CostData;
    monthlyData: MonthlyData[];
    vehicleCosts: VehicleCostData[];
    maintenanceCategories: CategoryData[];
    fuelTypes: CategoryData[];
    yearComparison: YearComparisonData | null;
  };
  revenueAnalytics: FinancialData;
  profitAnalytics: {
    totalProfit: number;
    profitMargin: number;
    monthlyProfit: { month: string; profit: number }[];
    vehicleProfits: { vehicle_id: string; vehicle_name: string; revenue: number; costs: number; profit: number }[];
  };
};

/**
 * Combines cost analytics data and revenue data into a single comprehensive dataset
 */
export function calculateCombinedFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [], 
  fuelData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
): CombinedFinancialData {
  // Calculate cost analytics
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

  // Calculate revenue analytics
  const revenueAnalytics = calculateFinancialData(tripsData, maintenanceData, fuelData);

  // Calculate profit analytics
  const totalProfit = revenueAnalytics.totalRevenue - summaryCosts.total;
  const profitMargin = revenueAnalytics.totalRevenue > 0 
    ? (totalProfit / revenueAnalytics.totalRevenue) * 100 
    : 0;

  // Calculate monthly profit
  const monthlyProfit = monthlyData.map((monthData, index) => {
    const monthRevenue = index < revenueAnalytics.monthlyData.length 
      ? revenueAnalytics.monthlyData[index].revenue 
      : 0;
    
    return {
      month: monthData.month,
      profit: monthRevenue - monthData.total
    };
  });

  // Calculate vehicle profits
  const vehicleProfits = calculateVehicleProfits(vehicleCosts, tripsData);

  return {
    costAnalytics: {
      summaryCosts,
      monthlyData,
      vehicleCosts,
      maintenanceCategories,
      fuelTypes,
      yearComparison
    },
    revenueAnalytics,
    profitAnalytics: {
      totalProfit,
      profitMargin,
      monthlyProfit,
      vehicleProfits
    }
  };
}

// Import functions from cost-analytics
import {
  calculateSummaryCosts,
  calculateMonthlyData,
  calculateVehicleCosts,
  calculateMaintenanceCategories,
  calculateFuelTypes,
  calculateYearComparison
} from "./cost-analytics";

/**
 * Calculate profit data by vehicle
 */
function calculateVehicleProfits(
  vehicleCosts: VehicleCostData[],
  tripsData: any[]
) {
  const vehicleRevenues: Record<string, number> = {};
  
  // Calculate revenue by vehicle
  tripsData.forEach(trip => {
    if (!trip.vehicle_id) return;
    
    if (!vehicleRevenues[trip.vehicle_id]) {
      vehicleRevenues[trip.vehicle_id] = 0;
    }
    
    vehicleRevenues[trip.vehicle_id] += Number(trip.amount || 0);
  });
  
  // Calculate profit by vehicle
  return vehicleCosts.map(vehicleCost => {
    const vehicleRevenue = vehicleRevenues[vehicleCost.vehicle_id] || 0;
    const vehicleProfit = vehicleRevenue - vehicleCost.total;
    
    return {
      vehicle_id: vehicleCost.vehicle_id,
      vehicle_name: vehicleCost.vehicle_name,
      revenue: vehicleRevenue,
      costs: vehicleCost.total,
      profit: vehicleProfit
    };
  }).sort((a, b) => b.profit - a.profit); // Sort by profit
}
