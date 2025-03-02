
// Type definitions for cost analytics components

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
