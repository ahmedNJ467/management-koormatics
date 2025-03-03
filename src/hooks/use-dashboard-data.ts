
import { useVehicleStats } from "./dashboard/use-vehicle-stats";
import { useDriverStats } from "./dashboard/use-driver-stats";
import { useFinancialData } from "./dashboard/use-financial-data";
import { useTripsData } from "./dashboard/use-trips-data";
import { useActivityFeed } from "./dashboard/use-activity-feed";
import { useAlertsData } from "./dashboard/use-alerts-data";
import { useDashboardPerformance } from "./use-dashboard-performance";
import { useEffect } from "react";

export function useDashboardData() {
  // Initialize performance monitoring
  const { startMeasurement, endMeasurement } = useDashboardPerformance();
  
  // Start measuring overall data loading
  useEffect(() => {
    const measurementId = startMeasurement('Dashboard Data Loading', 'data-load');
    return () => {
      endMeasurement('Dashboard Data Loading');
    };
  }, [startMeasurement, endMeasurement]);

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
