
import { useVehicleStats } from "./dashboard/use-vehicle-stats";
import { useDriverStats } from "./dashboard/use-driver-stats";
import { useFinancialData } from "./dashboard/use-financial-data";
import { useTripsData } from "./dashboard/use-trips-data";
import { useActivityFeed } from "./dashboard/use-activity-feed";
import { useAlertsData } from "./dashboard/use-alerts-data";

export function useDashboardData() {
  // Use specialized hooks for each data type
  const { vehicleStats, isLoadingVehicles } = useVehicleStats();
  const { driverStats, isLoadingDrivers } = useDriverStats();
  const { financialData, isLoadingFinancial, costsBreakdown } = useFinancialData();
  const { upcomingTrips, isLoadingTrips } = useTripsData();
  const { recentActivities, isLoadingActivity } = useActivityFeed();
  const { recentAlerts } = useAlertsData();

  return {
    recentAlerts,
    upcomingTrips,
    costsBreakdown,
    recentActivities,
    vehicleStats,
    driverStats,
    financialData,
    isLoadingVehicles,
    isLoadingDrivers,
    isLoadingFinancial,
    isLoadingTrips,
    isLoadingActivity
  };
}
