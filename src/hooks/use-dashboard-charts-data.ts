import { useMemo } from "react";
import { safeParseDate, getMonthName, isDateInMonth } from "@/utils/date-utils";

const FLEET_COLOR_PALETTE = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

const normalizeVehicleType = (value: unknown): string => {
  if (value === null || value === undefined) return "unknown";
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return normalized.length > 0 ? normalized : "unknown";
};

const getVehicleTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    soft_skin: "Soft Skin",
    armoured: "Armoured",
    sedan: "Sedan",
    suv: "SUV",
    pickup: "Pickup",
    truck: "Truck",
    van: "Van",
    bus: "Bus",
    unknown: "Unspecified",
  };

  if (labelMap[type]) {
    return labelMap[type];
  }

  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unspecified";
};

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
            const typeCounts = vehicles.reduce(
              (acc, vehicle) => {
                const type = normalizeVehicleType(
                  (vehicle as any)?.type ?? (vehicle as any)?.vehicle_type
                );
                acc.set(type, (acc.get(type) ?? 0) + 1);
                return acc;
              },
              new Map<string, number>()
            );

            const entries: [string, number][] = Array.from(
              typeCounts.entries()
            );

            return entries
              .map(([type, count], index) => ({
                name: getVehicleTypeLabel(type),
                value: count,
                color: FLEET_COLOR_PALETTE[index % FLEET_COLOR_PALETTE.length],
              }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);
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
              .reduce((sum, m) => sum + safeNumber((m as any).expense ?? (m as any).cost), 0);

            const repairsTotal = monthMaintenance
              .filter(
                (m) => !(m.description || "").toLowerCase().includes("service")
              )
              .reduce((sum, m) => sum + safeNumber((m as any).expense ?? (m as any).cost), 0);

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
              (sum, m) => sum + safeNumber((m as any).expense ?? (m as any).cost),
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
