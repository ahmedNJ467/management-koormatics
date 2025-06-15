
import { DisplayTrip } from "./types/trip";

export type FinancialData = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  tripCount: number;
  averageTripRevenue: number;
  monthlyData: MonthlyFinancialData[];
  expenseBreakdown: {
    maintenance: number;
    fuel: number;
    spareParts: number;
  };
};

export type MonthlyFinancialData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  maintenance?: number;
  fuel?: number;
  spareParts?: number;
};

/**
 * Calculate financial overview data from trips, maintenance, fuel logs, and spare parts
 */
export function calculateFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = []
): FinancialData {
  // Calculate total revenue from trips
  const totalRevenue = tripsData.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  
  // Filter out maintenance records that are not completed
  const completedMaintenance = Array.isArray(maintenanceData) 
    ? maintenanceData.filter(record => record && record.status === 'completed')
    : [];
  
  console.log('Financial Calcs - Completed maintenance items:', completedMaintenance);
  
  // Calculate maintenance costs
  const maintenanceCosts = completedMaintenance.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  
  // Calculate fuel costs
  const fuelCosts = Array.isArray(fuelData) 
    ? fuelData.reduce((sum, record) => sum + Number(record.cost || 0), 0)
    : 0;
  
  // Calculate spare parts total inventory value - include both in_stock and low_stock
  const sparePartsCosts = Array.isArray(sparePartsData)
    ? sparePartsData.reduce((sum, part) => {
        // Only include parts that are in_stock or low_stock
        if (part?.status === 'in_stock' || part?.status === 'low_stock') {
          const quantity = Number(part.quantity || 0);
          const costPerUnit = Number(part.unit_price || part.cost_per_unit || 0);
          const totalValue = quantity * costPerUnit;
          
          console.log('Part inventory:', part.name, `(${part.status})`, 'Quantity:', quantity, 'Cost per unit:', costPerUnit, 'Total value:', totalValue);
          
          return sum + totalValue;
        }
        return sum;
      }, 0)
    : 0;
  
  // Calculate total expenses
  const totalExpenses = maintenanceCosts + fuelCosts + sparePartsCosts;
  
  console.log('Financial Calcs - Maintenance costs:', maintenanceCosts);
  console.log('Financial Calcs - Fuel costs:', fuelCosts);
  console.log('Financial Calcs - Spare parts costs (including low stock):', sparePartsCosts);
  console.log('Financial Calcs - Total expenses:', totalExpenses);
  
  // Calculate profit and margin
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  // Calculate trip metrics
  const tripCount = Array.isArray(tripsData) ? tripsData.length : 0;
  const averageTripRevenue = tripCount > 0 ? totalRevenue / tripCount : 0;
  
  // Calculate monthly data
  const monthlyData = calculateMonthlyFinancialData(tripsData, completedMaintenance, fuelData, sparePartsData);
  
  return {
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin,
    tripCount,
    averageTripRevenue,
    monthlyData,
    expenseBreakdown: {
      maintenance: maintenanceCosts,
      fuel: fuelCosts,
      spareParts: sparePartsCosts
    }
  };
}

/**
 * Group financial data by month
 */
function calculateMonthlyFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = []
): MonthlyFinancialData[] {
  const months: Record<string, MonthlyFinancialData> = {};
  
  // Process trips revenue by month
  if (Array.isArray(tripsData)) {
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
          profit: 0,
          maintenance: 0,
          fuel: 0,
          spareParts: 0
        };
      }
      
      months[monthKey].revenue += Number(trip.amount || 0);
    });
  }
  
  // Process maintenance expenses by month
  if (Array.isArray(maintenanceData)) {
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
          profit: 0,
          maintenance: 0,
          fuel: 0,
          spareParts: 0
        };
      }
      
      const cost = Number(record.cost || 0);
      months[monthKey].maintenance += cost;
      months[monthKey].expenses += cost;
    });
  }
  
  // Process fuel expenses by month
  if (Array.isArray(fuelData)) {
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
          profit: 0,
          maintenance: 0,
          fuel: 0,
          spareParts: 0
        };
      }
      
      const cost = Number(record.cost || 0);
      months[monthKey].fuel += cost;
      months[monthKey].expenses += cost;
    });
  }
  
  // Process spare parts expenses by month - include both in_stock and low_stock
  if (Array.isArray(sparePartsData)) {
    sparePartsData.forEach(part => {
      // Only process parts that are in_stock or low_stock
      if (part?.status === 'in_stock' || part?.status === 'low_stock') {
        const dateString = part.last_used_date || part.purchase_date;
        if (!dateString) return;
        
        const date = new Date(dateString);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthName,
            revenue: 0,
            expenses: 0,
            profit: 0,
            maintenance: 0,
            fuel: 0,
            spareParts: 0
          };
        }
        
        // Calculate cost based on quantity used and cost per unit
        const quantityUsed = Number(part.quantity_used || 0);
        const costPerUnit = Number(part.unit_price || 0);
        const cost = quantityUsed * costPerUnit;
        
        // Only include costs for spare parts not already accounted for in maintenance
        const isIncludedInMaintenance = part.maintenance_id != null;
        if (!isIncludedInMaintenance) {
          months[monthKey].spareParts += cost;
          months[monthKey].expenses += cost;
        }
      }
    });
  }
  
  // Calculate profit for each month
  Object.values(months).forEach(month => {
    month.profit = month.revenue - month.expenses;
  });
  
  // Convert to array and sort by month
  return Object.entries(months)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_, data]) => data);
}
