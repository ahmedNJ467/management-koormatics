
import { StatCardProps } from "@/types/dashboard";

export function generateVehicleStats(
  vehicleStats: any,
  isLoadingVehicles: boolean
): StatCardProps[] {
  return [
    {
      name: "Total Vehicles",
      value: isLoadingVehicles ? "--" : String(vehicleStats?.totalVehicles || 0),
      icon: "Truck",
      change: "+2.5%",
      changeType: "positive"
    },
    {
      name: "Active Vehicles",
      value: isLoadingVehicles ? "--" : String(vehicleStats?.activeVehicles || 0),
      icon: "CheckCircle",
      change: "+1.2%",
      changeType: "positive"
    },
    {
      name: "In Maintenance",
      value: isLoadingVehicles ? "--" : String(vehicleStats?.inMaintenance || 0),
      icon: "Wrench",
      change: "-0.4%",
      changeType: "positive"
    },
    {
      name: "Total Drivers",
      value: isLoadingVehicles ? "--" : String(vehicleStats?.totalDrivers || 0),
      icon: "Users",
      change: "+3.1%",
      changeType: "positive"
    }
  ];
}

export function generateFinancialStats(
  financialData: any,
  isLoadingFinancial: boolean
): StatCardProps[] {
  return [
    {
      name: "Revenue (USD)",
      value: "$12,500",  // Mock revenue - would need a revenue table in real application
      icon: "DollarSign",
      change: "+5.2%",
      changeType: "positive"
    },
    {
      name: "Costs (USD)",
      value: isLoadingFinancial ? "--" : `$${Math.round(financialData?.totalCost || 0).toLocaleString()}`,
      icon: "CreditCard",
      change: "-1.8%",
      changeType: "positive"
    },
    {
      name: "Profit (USD)",
      value: isLoadingFinancial ? "--" : `$${Math.round((12500 - (financialData?.totalCost || 0))).toLocaleString()}`,
      icon: "TrendingUp",
      change: "+7.4%",
      changeType: "positive"
    }
  ];
}
