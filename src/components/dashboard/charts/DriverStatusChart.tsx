"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DriverStatusData {
  status: string;
  count: number;
}

interface DriverStatusChartProps {
  data?: DriverStatusData[];
  compact?: boolean;
}

// Mock data for fallback
const mockData: DriverStatusData[] = [
  { status: "Available", count: 12 },
  { status: "On Trip", count: 6 },
  { status: "Off Duty", count: 3 },
  { status: "Maintenance", count: 1 },
];

export function DriverStatusChart({ 
  data = mockData, 
  compact = false 
}: DriverStatusChartProps) {
  const height = compact ? 250 : 300;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="status" 
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
        />
        <Bar 
          dataKey="count" 
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          stroke="#ffffff"
          strokeWidth={2}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
