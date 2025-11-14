"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface FleetData {
  name: string;
  value: number;
  color?: string;
}

interface FleetDistributionChartProps {
  data?: FleetData[];
  compact?: boolean;
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const slugify = (value: string, fallback: string) =>
  value
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : fallback;

export function FleetDistributionChart({
  data = [],
  compact = false,
}: FleetDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No fleet data available</p>
        </div>
      </div>
    );
  }

  const chartData = useMemo(() => {
    return data.map((entry, index) => ({
      ...entry,
      key: slugify(entry.name, `segment-${index}`),
      fill: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [data]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return chartData.reduce((acc, entry) => {
      acc[entry.key] = {
        label: entry.name,
        color: entry.fill,
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);

  return (
    <ChartContainer
      config={chartConfig}
      className={`w-full ${compact ? "min-h-[240px]" : "min-h-[320px]"}`}
    >
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={compact ? 40 : 60}
          outerRadius={compact ? 75 : 95}
          paddingAngle={2}
          strokeWidth={2}
          cx="50%"
          cy="50%"
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="name" />}
          formatter={(value: number) => [`${value}`, "Vehicles"]}
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
