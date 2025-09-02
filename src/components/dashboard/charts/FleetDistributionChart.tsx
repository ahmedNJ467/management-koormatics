"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface FleetData {
  name: string;
  value: number;
  color: string;
}

interface FleetDistributionChartProps {
  data?: FleetData[];
  compact?: boolean;
}

// Mock data for fallback
const mockData: FleetData[] = [
  { name: "Sedans", value: 12, color: "#3b82f6" },
  { name: "SUVs", value: 8, color: "#10b981" },
  { name: "Vans", value: 4, color: "#f59e0b" },
  { name: "Trucks", value: 2, color: "#ef4444" },
];

export function FleetDistributionChart({
  data = mockData,
  compact = false,
}: FleetDistributionChartProps) {
  const height = compact ? 250 : 300;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={compact ? 60 : 80}
          fill="#3b82f6"
          dataKey="value"
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          wrapperStyle={{
            fontSize: '12px',
            color: '#64748b',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
