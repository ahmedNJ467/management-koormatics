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
  Cell,
} from "recharts";

interface PerformanceMetric {
  name: string;
  value: number;
  color?: string;
}

interface PerformanceMetricsChartProps {
  data?: PerformanceMetric[];
  compact?: boolean;
}

export function PerformanceMetricsChart({
  data = [],
  compact = false,
}: PerformanceMetricsChartProps) {
  const height = compact ? 250 : 300;

  // Show no data state if no data available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <div
          className="text-4xl font-bold"
          style={{ color: data[0]?.color || "#10b981" }}
        >
          {data[0]?.value || 0}%
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {data[0]?.name || "Utilization"}
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${data[0]?.value || 0}%`,
              backgroundColor: data[0]?.color || "#10b981",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
