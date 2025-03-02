
import { MonthlyData } from '@/lib/types/cost-analytics';

export function calculateMonthlyData(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): MonthlyData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((month, index) => ({
    month,
    maintenance: 0,
    fuel: 0,
    total: 0
  }));
  
  if (maintenanceData) {
    maintenanceData.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyData[month].maintenance += Number(item.cost);
    });
  }
  
  if (fuelData) {
    fuelData.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyData[month].fuel += Number(item.cost);
    });
  }
  
  monthlyData.forEach(item => {
    item.total = item.maintenance + item.fuel;
  });
  
  return monthlyData;
}
