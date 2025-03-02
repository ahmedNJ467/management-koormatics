
// Mock data for dashboard charts and statistics

export const monthlyData = [
  { month: "Jan", vehicles: 20, maintenance: 2, revenue: 15000, costs: 9000, profit: 6000 },
  { month: "Feb", vehicles: 22, maintenance: 3, revenue: 16500, costs: 10200, profit: 6300 },
  { month: "Mar", vehicles: 21, maintenance: 2, revenue: 15800, costs: 9500, profit: 6300 },
  { month: "Apr", vehicles: 23, maintenance: 4, revenue: 17200, costs: 10800, profit: 6400 },
  { month: "May", vehicles: 24, maintenance: 3, revenue: 18000, costs: 11000, profit: 7000 },
  { month: "Jun", vehicles: 24, maintenance: 3, revenue: 18500, costs: 11200, profit: 7300 },
];

export const fuelConsumptionData = [
  { month: "Jan", consumption: 2500 },
  { month: "Feb", consumption: 2300 },
  { month: "Mar", consumption: 2400 },
  { month: "Apr", consumption: 2200 },
  { month: "May", consumption: 2100 },
  { month: "Jun", consumption: 2000 },
];

export const fleetDistributionData = [
  { name: "Sedans", value: 10, color: "#10B981" },
  { name: "SUVs", value: 7, color: "#3B82F6" },
  { name: "Trucks", value: 4, color: "#8B5CF6" },
  { name: "Vans", value: 3, color: "#F97316" },
];

export const driverStatusData = [
  { name: "Active", value: 18, color: "#10B981" },
  { name: "On Leave", value: 3, color: "#F97316" },
  { name: "Inactive", value: 2, color: "#EF4444" },
];

export const maintenanceCostData = [
  { month: "Jan", preventive: 1200, repairs: 800, total: 2000 },
  { month: "Feb", preventive: 800, repairs: 1400, total: 2200 },
  { month: "Mar", preventive: 1000, repairs: 600, total: 1600 },
  { month: "Apr", preventive: 900, repairs: 1100, total: 2000 },
  { month: "May", preventive: 1200, repairs: 700, total: 1900 },
  { month: "Jun", preventive: 1100, repairs: 800, total: 1900 },
];

export const fuelCostData = [
  { month: "Jan", diesel: 1500, petrol: 1000, total: 2500 },
  { month: "Feb", diesel: 1400, petrol: 900, total: 2300 },
  { month: "Mar", diesel: 1600, petrol: 800, total: 2400 },
  { month: "Apr", diesel: 1300, petrol: 900, total: 2200 },
  { month: "May", diesel: 1200, petrol: 900, total: 2100 },
  { month: "Jun", diesel: 1100, petrol: 900, total: 2000 },
];

export const costsByVehicleType = [
  { name: "Sedans", maintenance: 4500, fuel: 6000, color: "#10B981" },
  { name: "SUVs", maintenance: 5200, fuel: 8200, color: "#3B82F6" },
  { name: "Trucks", maintenance: 7800, fuel: 9500, color: "#8B5CF6" },
  { name: "Vans", maintenance: 3800, fuel: 5200, color: "#F97316" },
];

export const initialStats = [
  {
    name: "Total Vehicles",
    value: "24",
    icon: "Car",
    change: "+2.5%",
    changeType: "positive" as const,
  },
  {
    name: "Active Drivers",
    value: "18",
    icon: "Users",
    change: "0%",
    changeType: "neutral" as const,
  },
  {
    name: "Maintenance Due",
    value: "3",
    icon: "Wrench",
    change: "-1",
    changeType: "negative" as const,
  },
  {
    name: "Fuel Efficiency",
    value: "92%",
    icon: "Fuel",
    change: "+4.3%",
    changeType: "positive" as const,
  },
];

export const initialFinancialStats = [
  {
    name: "Revenue (USD)",
    value: "$18,500",
    icon: "DollarSign",
    change: "+2.8%",
    changeType: "positive" as const,
  },
  {
    name: "Costs (USD)",
    value: "$11,200",
    icon: "CreditCard",
    change: "+1.8%",
    changeType: "negative" as const,
  },
  {
    name: "Profit (USD)",
    value: "$7,300",
    icon: "Wallet",
    change: "+4.3%",
    changeType: "positive" as const,
  },
];

export const initialAlerts = [
  { id: 1, title: "Vehicle KSB 123G due for service", priority: "high" as const, date: "Today" },
  { id: 2, title: "Driver license expiring", priority: "medium" as const, date: "Tomorrow" },
  { id: 3, title: "Fuel consumption above average", priority: "low" as const, date: "2 days ago" },
];

export const initialTrips = [
  { id: 1, client: "Acme Corp", destination: "Nairobi CBD", date: "Today, 2:00 PM", driver: "John Doe" },
  { id: 2, client: "XYZ Industries", destination: "Mombasa Road", date: "Tomorrow, 9:00 AM", driver: "Jane Smith" },
  { id: 3, client: "Global Enterprises", destination: "Karen", date: "Jun 15, 10:30 AM", driver: "David Johnson" },
];

export const initialCostsBreakdown = {
  maintenance: {
    preventive: 5200,
    repairs: 4400,
    total: 9600
  },
  fuel: {
    diesel: 7600,
    petrol: 5400,
    total: 13000
  }
};
