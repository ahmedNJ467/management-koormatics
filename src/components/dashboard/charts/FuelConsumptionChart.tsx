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

export function FuelConsumptionChart({
  data = [],
  compact = false,
}: FuelConsumptionChartProps) {
  const height = compact ? 300 : 350;

  // Show no data state if no data available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No fuel data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={{ stroke: "#e2e8f0" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          labelFormatter={(value) => value}
          formatter={(value: number, name: string) => [
            name === "consumption" ? `${value}L` : `${value} km/L`,
            name === "consumption" ? "Consumption" : "Efficiency",
          ]}
        />
        <Line
          type="monotone"
          dataKey="consumption"
          stroke="#3b82f6"
          strokeWidth={2}
          name="consumption"
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: "white" }}
        />
        <Line
          type="monotone"
          dataKey="efficiency"
          stroke="#10b981"
          strokeWidth={2}
          name="efficiency"
          dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
