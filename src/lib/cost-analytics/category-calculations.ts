
import { CategoryData } from '@/lib/types/cost-analytics';

export function calculateMaintenanceCategories(
  maintenanceData: any[] = []
): CategoryData[] {
  const categories: Record<string, number> = {};
  
  if (maintenanceData) {
    maintenanceData.forEach(item => {
      const category = item.description.split(' ')[0] || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += Number(item.cost);
    });
  }
  
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function calculateFuelTypes(
  fuelData: any[] = []
): CategoryData[] {
  const fuelTypes: Record<string, number> = {};
  
  if (fuelData) {
    fuelData.forEach(item => {
      const fuelType = item.fuel_type || 'Other';
      if (!fuelTypes[fuelType]) {
        fuelTypes[fuelType] = 0;
      }
      fuelTypes[fuelType] += Number(item.cost);
    });
  }
  
  return Object.entries(fuelTypes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
