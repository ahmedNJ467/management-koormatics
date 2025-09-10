import { useMemo } from "react";
import { safeParseDate, getMonthName, isDateInMonth } from "@/utils/date-utils";

interface ChartDataProps {
  monthlyData: any[];
  fuelConsumptionData: any[];
  fleetDistributionData: any[];
  driverStatusData: any[];
  maintenanceCostData: any[];
  maintenanceCostsData: any[];
  fuelCostData: any[];
}

export function useDashboardChartsData(
  vehicles: any[] = [],
  drivers: any[] = [],
  maintenanceData: any[] = [],
  fuelLogsData: any[] = []
): ChartDataProps {
  console.log("🔍 useDashboardChartsData called with:", {
    vehicles: vehicles.length,
    drivers: drivers.length,
    maintenanceData: maintenanceData.length,
    fuelLogsData: fuelLogsData.length,
  });

  const processedData = useMemo(() => {
    console.log("🔄 Processing chart data...");

    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to safely filter and sum
    const safeSum = (array: any[], key: string): number => {
      return array.reduce((sum, item) => sum + safeNumber(item[key]), 0);
    };

    // Return empty data if no real data is available
    if (
      vehicles.length === 0 &&
      drivers.length === 0 &&
      maintenanceData.length === 0 &&
      fuelLogsData.length === 0
    ) {
      console.log("📊 No data available, returning empty data");
      return {
        monthlyData: [],
        fuelConsumptionData: [],
        fleetDistributionData: [],
        driverStatusData: [],
        maintenanceCostData: [],
        maintenanceCostsData: [],
        fuelCostData: [],
      };
    }

    console.log("🔄 Processing real data...");

    // Generate monthly labels (last 6 months) - only once
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString("default", { month: "short" });
    }).reverse();

    // Simple data processing with early returns for empty data
    const monthlyData = months.map((month) => ({
      month,
      vehicles: vehicles.length,
      maintenance: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
    }));

    // Fuel consumption data - use real data only

    const fuelConsumptionData =
      fuelLogsData.length > 0
        ? months.map((month) => {
            const monthLogs = fuelLogsData.filter((log) => {
              if (!log.date) return false;
              return isDateInMonth(log.date, month);
            });

            const totalVolume = monthLogs.reduce(
              (sum, log) => sum + safeNumber(log.volume),
              0
            );

            return {
              date: month,
              consumption: Math.max(0, Math.round(totalVolume)),
              efficiency:
                monthLogs.length > 0
                  ? Math.round(totalVolume / monthLogs.length)
                  : 0,
            };
          })
        : [];

    // Fleet distribution data - use real data only
    const fleetDistributionData =
      vehicles.length > 0
        ? (() => {
            const vehicleTypes = Array.from(
              new Set(
                vehicles
                  .map((v) => v.type || v.vehicle_type || "Unknown")
                  .filter(Boolean)
              )
            );
            const colors = [
              "#10B981",
              "#3B82F6",
              "#8B5CF6",
              "#F97316",
              "#EF4444",
              "#EC4899",
            ];

            return vehicleTypes.map((type, index) => ({
              name: type,
              value: vehicles.filter((v) => (v.type || v.vehicle_type) === type)
                .length,
              color: colors[index % colors.length],
            }));
          })()
        : [];

    // Driver status data - use real data only
    const driverStatusData =
      drivers.length > 0
        ? (() => {
            const statusTypes = Array.from(
              new Set(drivers.map((d) => d.status || "unknown").filter(Boolean))
            );
            return statusTypes.map((status) => ({
              name:
                status === "active"
                  ? "Active"
                  : status === "on_leave"
                  ? "On Leave"
                  : status === "inactive"
                  ? "Inactive"
                  : status,
              value: drivers.filter((d) => (d.status || "unknown") === status)
                .length,
              color:
                status === "active"
                  ? "#10B981"
                  : status === "on_leave"
                  ? "#F97316"
                  : "#EF4444",
            }));
          })()
        : [];

    // Maintenance cost data - use real data only
    const maintenanceCostData =
      maintenanceData.length > 0
        ? months.map((month) => {
            const monthMaintenance = maintenanceData.filter((m) => {
              if (!m.date) return false;
              try {
                const maintDate = new Date(m.date);
                return (
                  maintDate.toLocaleString("default", { month: "short" }) ===
                  month
                );
              } catch (error) {
                console.warn("Invalid date in maintenance:", m.date);
                return false;
              }
            });

            const serviceTotal = monthMaintenance
              .filter((m) =>
                (m.description || "").toLowerCase().includes("service")
              )
              .reduce((sum, m) => sum + safeNumber(m.cost), 0);

            const repairsTotal = monthMaintenance
              .filter(
                (m) => !(m.description || "").toLowerCase().includes("service")
              )
              .reduce((sum, m) => sum + safeNumber(m.cost), 0);

            return {
              month,
              service: Math.max(0, Math.round(serviceTotal)),
              repairs: Math.max(0, Math.round(repairsTotal)),
              total: Math.max(0, Math.round(serviceTotal + repairsTotal)),
            };
          })
        : [];

    // New maintenance costs data for the chart - use real data only
    const maintenanceCostsData =
      maintenanceData.length > 0
        ? months.map((month) => {
            const monthMaintenance = maintenanceData.filter((m) => {
              if (!m.date) return false;
              return isDateInMonth(m.date, month);
            });

            const totalCost = monthMaintenance.reduce(
              (sum, m) => sum + safeNumber(m.cost),
              0
            );

            return {
              month,
              cost: Math.max(0, Math.round(totalCost)),
            };
          })
        : [];

    // Fuel cost data - use real data only
    const fuelCostData =
      fuelLogsData.length > 0
        ? months.map((month) => {
            const monthLogs = fuelLogsData.filter((log) => {
              if (!log.date) return false;
              return isDateInMonth(log.date, month);
            });

            const dieselTotal = monthLogs
              .filter((log) => (log.fuel_type || "").toLowerCase() === "diesel")
              .reduce((sum, log) => sum + safeNumber(log.cost), 0);

            const petrolTotal = monthLogs
              .filter((log) => (log.fuel_type || "").toLowerCase() === "petrol")
              .reduce((sum, log) => sum + safeNumber(log.cost), 0);

            return {
              month,
              diesel: Math.max(0, Math.round(dieselTotal)),
              petrol: Math.max(0, Math.round(petrolTotal)),
              total: Math.max(0, Math.round(dieselTotal + petrolTotal)),
            };
          })
        : [];

    const result = {
      monthlyData,
      fuelConsumptionData,
      fleetDistributionData,
      driverStatusData,
      maintenanceCostData,
      maintenanceCostsData,
      fuelCostData,
    };

    console.log("📊 Chart data hook returning:", result);
    return result;
  }, [vehicles, drivers, maintenanceData, fuelLogsData]);

  console.log("🎯 useDashboardChartsData final return:", processedData);
  return processedData;
}
