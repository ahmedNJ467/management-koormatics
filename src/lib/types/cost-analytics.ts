
// Define types for cost analytics data
export type CostData = {
  maintenance: number;
  fuel: number;
  spareParts: number;
  total: number;
};

export type MonthlyData = {
  month: string;
  maintenance: number;
  fuel: number;
  spareParts: number;
  total: number;
};

export type VehicleCostData = {
  vehicle_id: string;
  vehicle_name: string;
  maintenance: number;
  fuel: number;
  spareParts: number;
  total: number;
};

export type CategoryData = {
  name: string;
  value: number;
};

// Define type for year-over-year comparison
export type YearComparisonData = {
  currentYear: string;
  previousYear: string;
  maintenance: {
    current: number;
    previous: number;
    percentChange: number;
  };
  fuel: {
    current: number;
    previous: number;
    percentChange: number;
  };
  spareParts: {
    current: number;
    previous: number;
    percentChange: number;
  };
  total: {
    current: number;
    previous: number;
    percentChange: number;
  };
};

// Define colors for charts
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
