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

export function FleetDistributionChart({
  data = [],
  compact = false,
}: FleetDistributionChartProps) {
  const height = compact ? 250 : 300;

  // Show no data state if no data available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No fleet data available</p>
        </div>
      </div>
    );
  }

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
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            fontSize: "12px",
            color: "#64748b",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
