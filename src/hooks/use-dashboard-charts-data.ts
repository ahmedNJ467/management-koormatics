
import { useMemo } from 'react';

interface ChartDataProps {
  monthlyData: any[];
  fuelConsumptionData: any[];
  fleetDistributionData: any[];
  driverStatusData: any[];
  maintenanceCostData: any[];
  fuelCostData: any[];
}

export function useDashboardChartsData(
  vehicles: any[] = [],
  drivers: any[] = [],
  maintenanceData: any[] = [],
  fuelLogsData: any[] = []
): ChartDataProps {
  // Process data for charts
  const processedData = useMemo(() => {
    // Generate monthly labels (last 6 months)
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    // Fleet overview data
    const monthlyData = months.map(month => {
      // For real implementation, we would filter data by month
      // This is a simplified example
      return {
        month,
        vehicles: vehicles.length,
        maintenance: maintenanceData.filter(m => {
          const maintDate = new Date(m.date);
          return maintDate.toLocaleString('default', { month: 'short' }) === month;
        }).length,
        revenue: 0, // Would need invoice data
        costs: 0,   // Would calculate from maintenance and fuel
        profit: 0   // Would calculate from revenue and costs
      };
    });

    // Fuel consumption data
    const fuelConsumptionData = months.map(month => {
      const monthLogs = fuelLogsData.filter(log => {
        const logDate = new Date(log.date);
        return logDate.toLocaleString('default', { month: 'short' }) === month;
      });
      
      const totalVolume = monthLogs.reduce((sum, log) => sum + Number(log.volume), 0);
      
      return {
        month,
        consumption: Math.round(totalVolume)
      };
    });

    // Fleet distribution data
    const vehicleTypes = [...new Set(vehicles.map(v => v.type))];
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#EF4444', '#EC4899'];
    
    const fleetDistributionData = vehicleTypes.map((type, index) => {
      return {
        name: type,
        value: vehicles.filter(v => v.type === type).length,
        color: colors[index % colors.length]
      };
    });

    // Driver status data
    const statusTypes = [...new Set(drivers.map(d => d.status))];
    const driverStatusData = statusTypes.map((status, index) => {
      return {
        name: status,
        value: drivers.filter(d => d.status === status).length,
        color: status === 'active' ? '#10B981' : status === 'on_leave' ? '#F97316' : '#EF4444'
      };
    });

    // Maintenance cost data
    const maintenanceCostData = months.map(month => {
      const monthMaintenance = maintenanceData.filter(m => {
        const maintDate = new Date(m.date);
        return maintDate.toLocaleString('default', { month: 'short' }) === month;
      });
      
      const serviceTotal = monthMaintenance
        .filter(m => m.description.toLowerCase().includes('service'))
        .reduce((sum, m) => sum + Number(m.cost), 0);
      
      const repairsTotal = monthMaintenance
        .filter(m => !m.description.toLowerCase().includes('service'))
        .reduce((sum, m) => sum + Number(m.cost), 0);
      
      return {
        month,
        service: Math.round(serviceTotal),
        repairs: Math.round(repairsTotal),
        total: Math.round(serviceTotal + repairsTotal)
      };
    });

    // Fuel cost data
    const fuelCostData = months.map(month => {
      const monthLogs = fuelLogsData.filter(log => {
        const logDate = new Date(log.date);
        return logDate.toLocaleString('default', { month: 'short' }) === month;
      });
      
      const dieselTotal = monthLogs
        .filter(log => log.fuel_type === 'diesel')
        .reduce((sum, log) => sum + Number(log.cost), 0);
      
      const petrolTotal = monthLogs
        .filter(log => log.fuel_type === 'petrol')
        .reduce((sum, log) => sum + Number(log.cost), 0);
      
      return {
        month,
        diesel: Math.round(dieselTotal),
        petrol: Math.round(petrolTotal),
        total: Math.round(dieselTotal + petrolTotal)
      };
    });

    return {
      monthlyData,
      fuelConsumptionData,
      fleetDistributionData,
      driverStatusData,
      maintenanceCostData,
      fuelCostData
    };
  }, [vehicles, drivers, maintenanceData, fuelLogsData]);

  return processedData;
}
