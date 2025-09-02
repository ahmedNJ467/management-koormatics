"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FuelConsumptionData {
  date: string;
  consumption: number;
  efficiency: number;
}

interface FuelConsumptionChartProps {
  data?: FuelConsumptionData[];
  compact?: boolean;
}

// Mock data for fallback
const mockData: FuelConsumptionData[] = [
  { date: "2024-01-01", consumption: 120, efficiency: 12.5 },
  { date: "2024-01-02", consumption: 135, efficiency: 11.8 },
  { date: "2024-01-03", consumption: 110, efficiency: 13.2 },
  { date: "2024-01-04", consumption: 145, efficiency: 11.5 },
  { date: "2024-01-05", consumption: 125, efficiency: 12.8 },
  { date: "2024-01-06", consumption: 140, efficiency: 12.0 },
  { date: "2024-01-07", consumption: 115, efficiency: 13.5 },
];

export function FuelConsumptionChart({
  data = mockData,
  compact = false,
}: FuelConsumptionChartProps) {
  const height = compact ? 300 : 350;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number, name: string) => [
            name === "consumption" ? `${value}L` : `${value} km/L`,
            name === "consumption" ? "Consumption" : "Efficiency",
          ]}
        />
        <Line
          type="monotone"
          dataKey="consumption"
          stroke="#8b5cf6"
          strokeWidth={3}
          name="consumption"
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="efficiency"
          stroke="#10b981"
          strokeWidth={3}
          name="efficiency"
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
