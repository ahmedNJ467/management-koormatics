
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
  
  // Calculate spare parts costs (only for parts that have been used and not included in maintenance)
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    // Check if the part has been used
    const quantityUsed = Number(part?.quantity_used || 0);
    if (quantityUsed <= 0) return sum;
    
    const costPerUnit = Number(part?.cost_per_unit || part?.unit_price || 0);
    const totalCost = quantityUsed * costPerUnit;
    
    console.log(`Spare part ${part.name}: ${quantityUsed} x $${costPerUnit} = $${totalCost}`);
    
    // Only count parts not already included in maintenance to avoid double counting
    const isIncludedInMaintenance = part.maintenance_id != null;
    
    // Add to sum only if not included in maintenance
    if (!isIncludedInMaintenance) {
      console.log(`Adding ${part.name} cost to total: $${totalCost} (not included in maintenance)`);
      return sum + totalCost;
    } else {
      console.log(`Skipping ${part.name} cost: $${totalCost} (already included in maintenance)`);
      return sum;
    }
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
  console.log('Calculated spare parts costs:', costs.spareParts);
  console.log('Total costs:', costs.total);
  
  return costs;
}
