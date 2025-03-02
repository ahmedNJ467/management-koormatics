
import { CostData } from '@/lib/types/cost-analytics';

export function calculateSummaryCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): CostData {
  const costs: CostData = {
    maintenance: maintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
    fuel: fuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
    total: 0
  };
  costs.total = costs.maintenance + costs.fuel;
  return costs;
}
