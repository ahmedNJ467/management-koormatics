
import { CostData } from '@/lib/types/cost-analytics';

export function calculateSummaryCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = [],
  sparePartsData: any[] = []
): CostData {
  // Ensure we have valid arrays, even if empty
  const safeMaintenanceData = Array.isArray(maintenanceData) ? maintenanceData : [];
  const safeFuelData = Array.isArray(fuelData) ? fuelData : [];
  const safeSparePartsData = Array.isArray(sparePartsData) ? sparePartsData : [];

  // Filter out maintenance records that are not completed
  const completedMaintenance = safeMaintenanceData.filter(
    item => item?.status === 'completed'
  );

  console.log('Completed maintenance items:', completedMaintenance);
  
  // Calculate maintenance costs
  const maintenanceCosts = completedMaintenance.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0);
  
  // Calculate fuel costs
  const fuelCosts = safeFuelData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0);
  
  // Calculate spare parts costs - include both in_stock and low_stock items
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    // Only include parts that are in_stock or low_stock
    if (part?.status === 'in_stock' || part?.status === 'low_stock') {
      const quantity = Number(part?.quantity || 0);
      const costPerUnit = Number(part?.unit_price || part?.cost_per_unit || 0);
      const totalValue = quantity * costPerUnit;
      
      console.log(`Spare part ${part.name} (${part.status}): ${quantity} × $${costPerUnit} = $${totalValue}`);
      
      return sum + totalValue;
    }
    return sum;
  }, 0);
  
  const costs: CostData = {
    maintenance: maintenanceCosts,
    fuel: fuelCosts,
    spareParts: sparePartsCosts,
    total: 0
  };
  
  costs.total = costs.maintenance + costs.fuel + costs.spareParts;
  console.log('Calculated maintenance costs:', costs.maintenance);
  console.log('Calculated fuel costs:', costs.fuel);
  console.log('Calculated spare parts costs (including low stock):', costs.spareParts);
  console.log('Total costs:', costs.total);
  
  return costs;
}
