import { MonthlyData } from "@/lib/types/cost-analytics";

export function calculateMonthlyData(
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = []
): MonthlyData[] {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyData = months.map((month, index) => ({
    month,
    maintenance: 0,
    fuel: 0,
    spareParts: 0,
    total: 0,
  }));

  if (maintenanceData && Array.isArray(maintenanceData)) {
    // Filter to only include completed maintenance
    const completedMaintenance = maintenanceData.filter(
      (item) => item?.status === "completed"
    );

    completedMaintenance.forEach((item) => {
      if (item.date) {
        const month = new Date(item.date).getMonth();
        monthlyData[month].maintenance += Number(
          (item as any).expense ?? (item as any).cost ?? 0
        );
      }
    });
  }

  if (fuelData && Array.isArray(fuelData)) {
    fuelData.forEach((item) => {
      if (item.date) {
        const month = new Date(item.date).getMonth();
        monthlyData[month].fuel += Number(item.cost || 0);
      }
    });
  }

  if (sparePartsData && Array.isArray(sparePartsData)) {
    sparePartsData.forEach((item) => {
      // Use purchase_date primarily for inventory value accounting
      const dateString = item.purchase_date || item.last_used_date;
      if (dateString) {
        const month = new Date(dateString).getMonth();
        const quantity = Number(item.quantity || 0);
        const costPerUnit = Number(item.unit_price || 0);
        monthlyData[month].spareParts += quantity * costPerUnit;
      }
    });
  }

  monthlyData.forEach((item) => {
    item.total = item.maintenance + item.fuel + item.spareParts;
  });

  return monthlyData;
}
