
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
  
  // Calculate spare parts costs (only for parts that have been used)
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    const quantityUsed = Number(part?.quantity_used || 0);
    const costPerUnit = Number(part?.cost_per_unit || 0);
    return sum + (quantityUsed * costPerUnit);
  }, 0);
  
  const costs: CostData = {
    maintenance: completedMaintenance.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    fuel: safeFuelData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
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
