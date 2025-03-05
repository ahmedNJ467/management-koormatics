
import { CostData } from '@/lib/types/cost-analytics';

export function calculateSummaryCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): CostData {
  // Ensure we have valid arrays, even if empty
  const safeMaintenanceData = Array.isArray(maintenanceData) ? maintenanceData : [];
  const safeFuelData = Array.isArray(fuelData) ? fuelData : [];

  // Filter out scheduled maintenance
  const nonScheduledMaintenance = safeMaintenanceData.filter(
    item => item?.status !== 'scheduled'
  );

  const costs: CostData = {
    maintenance: nonScheduledMaintenance.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    fuel: safeFuelData.reduce((sum, item) => sum + (Number(item?.cost) || 0), 0),
    total: 0
  };
  costs.total = costs.maintenance + costs.fuel;
  return costs;
}
