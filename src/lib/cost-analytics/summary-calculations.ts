
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
  
  // Calculate spare parts costs - only include parts that have been used
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    // Only include parts with usage (quantity_used > 0) regardless of status
    const quantityUsed = Number(part?.quantity_used || 0);
    if (quantityUsed > 0) {
      const costPerUnit = Number(part?.unit_price || 0);
      const usageCost = quantityUsed * costPerUnit;
      
      console.log(`Spare part ${part.name}: ${quantityUsed} used × $${costPerUnit} = $${usageCost}`);
      
      return sum + usageCost;
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
