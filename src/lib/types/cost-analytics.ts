
// Define types for cost analytics data
export type CostData = {
  maintenance: number;
  fuel: number;
  total: number;
};

export type MonthlyData = {
  month: string;
  maintenance: number;
  fuel: number;
  total: number;
};

export type VehicleCostData = {
  vehicle_id: string;
  vehicle_name: string;
  maintenance: number;
  fuel: number;
  total: number;
};

export type CategoryData = {
  name: string;
  value: number;
};

// Define colors for charts
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
