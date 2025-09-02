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

interface MaintenanceCostData {
  month: string;
  preventive: number;
  corrective: number;
  emergency: number;
}

interface MaintenanceCostsChartProps {
  data?: MaintenanceCostData[];
  compact?: boolean;
}

// Mock data for fallback
const mockData: MaintenanceCostData[] = [
  { month: "Jan", preventive: 2400, corrective: 1200, emergency: 800 },
  { month: "Feb", preventive: 2200, corrective: 1500, emergency: 600 },
  { month: "Mar", preventive: 2800, corrective: 1000, emergency: 1200 },
  { month: "Apr", preventive: 2600, corrective: 1300, emergency: 900 },
  { month: "May", preventive: 2900, corrective: 1100, emergency: 700 },
  { month: "Jun", preventive: 2500, corrective: 1400, emergency: 1000 },
];

export function MaintenanceCostsChart({
  data = mockData,
  compact = false,
}: MaintenanceCostsChartProps) {
  const height = compact ? 250 : 300;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
      >
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
          labelStyle={{
            color: "hsl(var(--foreground))",
            fontWeight: "600",
          }}
        />
        <Bar
          dataKey="preventive"
          stackId="a"
          fill="hsl(var(--blue-500))"
          name="Preventive"
          radius={[4, 4, 0, 0]}
          stroke="hsl(var(--blue-600))"
          strokeWidth={1}
        />
        <Bar
          dataKey="corrective"
          stackId="a"
          fill="hsl(var(--green-500))"
          name="Corrective"
          radius={[4, 4, 0, 0]}
          stroke="hsl(var(--green-600))"
          strokeWidth={1}
        />
        <Bar
          dataKey="emergency"
          stackId="a"
          fill="hsl(var(--orange-500))"
          name="Emergency"
          radius={[4, 4, 0, 0]}
          stroke="hsl(var(--orange-600))"
          strokeWidth={1}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
