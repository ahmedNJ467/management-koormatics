import { useMemo } from "react";

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
  console.log('🔍 useDashboardChartsData called with:', { 
    vehicles: vehicles.length, 
    drivers: drivers.length, 
    maintenanceData: maintenanceData.length, 
    fuelLogsData: fuelLogsData.length 
  });
  
  const processedData = useMemo(() => {
    console.log('🔄 Processing chart data...');
    
    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    
    // Helper function to safely filter and sum
    const safeSum = (array: any[], key: string): number => {
      return array.reduce((sum, item) => sum + safeNumber(item[key]), 0);
    };
    
    // Only process data if we have some data to work with
    if (
      vehicles.length === 0 &&
      drivers.length === 0 &&
      maintenanceData.length === 0 &&
      fuelLogsData.length === 0
    ) {
      console.log('📊 No data available, returning sample data');
      // Return sample data immediately for better UX
      const sampleData = {
        monthlyData: [],
        fuelConsumptionData: [
          { month: 'Jan', consumption: 300 },
          { month: 'Feb', consumption: 450 },
          { month: 'Mar', consumption: 280 },
          { month: 'Apr', consumption: 520 },
          { month: 'May', consumption: 380 },
          { month: 'Jun', consumption: 410 }
        ],
        fleetDistributionData: [
          { name: "Armoured", value: 3, color: "#10B981" },
          { name: "Soft Skin", value: 2, color: "#3B82F6" },
        ],
        driverStatusData: [
          { name: "Active", value: 3, color: "#10B981" },
          { name: "Inactive", value: 1, color: "#EF4444" },
        ],
        maintenanceCostData: [
          { month: 'Jan', service: 400, repairs: 600 },
          { month: 'Feb', service: 350, repairs: 450 },
          { month: 'Mar', service: 500, repairs: 700 },
          { month: 'Apr', service: 300, repairs: 550 },
          { month: 'May', service: 450, repairs: 650 },
          { month: 'Jun', service: 380, repairs: 480 }
        ],
        maintenanceCostsData: [
          { month: 'Jan', cost: 1200, type: "Preventive" },
          { month: 'Feb', cost: 800, type: "Repair" },
          { month: 'Mar', cost: 1500, type: "Preventive" },
          { month: 'Apr', cost: 900, type: "Repair" },
          { month: 'May', cost: 1100, type: "Preventive" },
          { month: 'Jun', cost: 1300, type: "Repair" },
          { month: 'Jul', cost: 700, type: "Preventive" },
          { month: 'Aug', cost: 1600, type: "Repair" },
        ],
        fuelCostData: [],
      };
      console.log('📊 Sample data returned:', sampleData);
      return sampleData;
    }

    console.log('🔄 Processing real data...');

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

    // Fuel consumption data - use real data if available, otherwise sample
    const fuelConsumptionData =
      fuelLogsData.length > 0
        ? months.map((month) => {
            const monthLogs = fuelLogsData.filter((log) => {
              if (!log.date) return false;
              try {
                const logDate = new Date(log.date);
                return (
                  logDate.toLocaleString("default", { month: "short" }) === month
                );
              } catch (error) {
                console.warn('Invalid date in fuel log:', log.date);
                return false;
              }
            });

            const totalVolume = monthLogs.reduce(
              (sum, log) => sum + safeNumber(log.volume),
              0
            );

            return {
              month,
              consumption: Math.max(0, Math.round(totalVolume)),
            };
          })
        : months.map((month) => ({
            month,
            consumption: Math.floor(Math.random() * 500) + 200,
          }));

    // Fleet distribution data - use real data if available
    const fleetDistributionData =
      vehicles.length > 0
        ? (() => {
            const vehicleTypes = [
              ...new Set(
                vehicles
                  .map((v) => v.type || v.vehicle_type || "Unknown")
                  .filter(Boolean)
              ),
            ];
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
        : [
            { name: "Sedan", value: 8, color: "#10B981" },
            { name: "SUV", value: 12, color: "#3B82F6" },
            { name: "Van", value: 6, color: "#8B5CF6" },
            { name: "Truck", value: 4, color: "#F97316" },
          ];

    // Driver status data - use real data if available
    const driverStatusData =
      drivers.length > 0
        ? (() => {
            const statusTypes = [
              ...new Set(
                drivers
                  .map((d) => d.status || "unknown")
                  .filter(Boolean)
              ),
            ];
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
        : [
            { name: "Active", value: 15, color: "#10B981" },
            { name: "On Leave", value: 3, color: "#F97316" },
            { name: "Inactive", value: 2, color: "#EF4444" },
          ];

    // Maintenance cost data - use real data if available
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
                console.warn('Invalid date in maintenance:', m.date);
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
        : months.map((month) => ({
            month,
            service: Math.floor(Math.random() * 800) + 200,
            repairs: Math.floor(Math.random() * 1000) + 300,
            total: Math.floor(Math.random() * 1800) + 500,
          }));

    // New maintenance costs data for the chart
    const maintenanceCostsData =
      maintenanceData.length > 0
        ? months.flatMap((month) => {
            const monthMaintenance = maintenanceData.filter((m) => {
              if (!m.date) return false;
              try {
                const maintDate = new Date(m.date);
                return (
                  maintDate.toLocaleString("default", { month: "short" }) ===
                  month
                );
              } catch (error) {
                console.warn('Invalid date in maintenance:', m.date);
                return false;
              }
            });

            const preventiveTotal = monthMaintenance
              .filter((m) =>
                (m.description || "").toLowerCase().includes("service") ||
                (m.description || "").toLowerCase().includes("preventive")
              )
              .reduce((sum, m) => sum + safeNumber(m.cost), 0);

            const repairTotal = monthMaintenance
              .filter(
                (m) => !(m.description || "").toLowerCase().includes("service") &&
                       !(m.description || "").toLowerCase().includes("preventive")
              )
              .reduce((sum, m) => sum + safeNumber(m.cost), 0);

            return [
              { month, cost: Math.max(0, Math.round(preventiveTotal)), type: "Preventive" },
              { month, cost: Math.max(0, Math.round(repairTotal)), type: "Repair" }
            ].filter(item => item.cost > 0);
          })
        : months.flatMap((month) => [
            { month, cost: Math.floor(Math.random() * 800) + 400, type: "Preventive" },
            { month, cost: Math.floor(Math.random() * 1000) + 300, type: "Repair" }
          ]);

    // Fuel cost data - use real data if available
    const fuelCostData =
      fuelLogsData.length > 0
        ? months.map((month) => {
            const monthLogs = fuelLogsData.filter((log) => {
              if (!log.date) return false;
              try {
                const logDate = new Date(log.date);
                return (
                  logDate.toLocaleString("default", { month: "short" }) === month
                );
              } catch (error) {
                console.warn('Invalid date in fuel log:', log.date);
                return false;
              }
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
        : months.map((month) => ({
            month,
            diesel: Math.floor(Math.random() * 500) + 100,
            petrol: Math.floor(Math.random() * 400) + 80,
            total: Math.floor(Math.random() * 900) + 180,
          }));

    const result = {
      monthlyData,
      fuelConsumptionData,
      fleetDistributionData,
      driverStatusData,
      maintenanceCostData,
      maintenanceCostsData,
      fuelCostData,
    };

    console.log('📊 Chart data hook returning:', result);
    return result;
  }, [vehicles, drivers, maintenanceData, fuelLogsData]);

  console.log('🎯 useDashboardChartsData final return:', processedData);
  return processedData;
}
