
import { DisplayTrip } from "./types/trip";

export type FinancialData = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  tripCount: number;
  averageTripRevenue: number;
  monthlyData: MonthlyFinancialData[];
};

export type MonthlyFinancialData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

/**
 * Calculate financial overview data from trips, maintenance, and fuel logs
 */
export function calculateFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = []
): FinancialData {
  // Calculate total revenue from trips
  const totalRevenue = tripsData.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  
  // Filter out scheduled maintenance
  const nonScheduledMaintenance = maintenanceData.filter(record => record.status !== 'scheduled');
  
  // Calculate total expenses (maintenance + fuel)
  const maintenanceCosts = nonScheduledMaintenance.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  const fuelCosts = fuelData.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  const totalExpenses = maintenanceCosts + fuelCosts;
  
  // Calculate profit and margin
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  // Calculate trip metrics
  const tripCount = tripsData.length;
  const averageTripRevenue = tripCount > 0 ? totalRevenue / tripCount : 0;
  
  // Calculate monthly data
  const monthlyData = calculateMonthlyFinancialData(tripsData, nonScheduledMaintenance, fuelData);
  
  return {
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin,
    tripCount,
    averageTripRevenue,
    monthlyData
  };
}

/**
 * Group financial data by month
 */
function calculateMonthlyFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = []
): MonthlyFinancialData[] {
  const months: Record<string, MonthlyFinancialData> = {};
  
  // Process trips revenue by month
  tripsData.forEach(trip => {
    if (!trip.date) return;
    
    const date = new Date(trip.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!months[monthKey]) {
      months[monthKey] = {
        month: monthName,
        revenue: 0,
        expenses: 0,
        profit: 0
      };
    }
    
    months[monthKey].revenue += Number(trip.amount || 0);
  });
  
  // Process maintenance expenses by month
  maintenanceData.forEach(record => {
    if (!record.date) return;
    
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!months[monthKey]) {
      months[monthKey] = {
        month: monthName,
        revenue: 0,
        expenses: 0,
        profit: 0
      };
    }
    
    months[monthKey].expenses += Number(record.cost || 0);
  });
  
  // Process fuel expenses by month
  fuelData.forEach(record => {
    if (!record.date) return;
    
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!months[monthKey]) {
      months[monthKey] = {
        month: monthName,
        revenue: 0,
        expenses: 0,
        profit: 0
      };
    }
    
    months[monthKey].expenses += Number(record.cost || 0);
  });
  
  // Calculate profit for each month
  Object.values(months).forEach(month => {
    month.profit = month.revenue - month.expenses;
  });
  
  // Convert to array and sort by month
  return Object.entries(months)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_, data]) => data);
}
