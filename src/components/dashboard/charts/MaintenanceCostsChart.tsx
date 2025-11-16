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
  cost: number;
}

interface MaintenanceCostsChartProps {
  data?: MaintenanceCostData[];
  compact?: boolean;
}

export function MaintenanceCostsChart({
  data = [],
  compact = false,
}: MaintenanceCostsChartProps) {
  const height = compact ? 250 : 300;

  // Show no data state if no data available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No maintenance data available</p>
        </div>
      </div>
    );
  }

  // If all values are zero, show the same empty state instead of a flat line at 0
  const hasNonZero = data.some((d) => Number(d.cost) > 0);
  if (!hasNonZero) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No maintenance data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          domain={["dataMin", "dataMax"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Cost"]}
        />
        <Bar
          dataKey="cost"
          fill="#3b82f6"
          name="Maintenance Cost"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
