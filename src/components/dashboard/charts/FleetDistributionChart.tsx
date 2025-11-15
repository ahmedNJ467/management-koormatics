"use client";

import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
  const heightClass = compact ? "max-h-[240px]" : "max-h-[320px]";
  const defaultColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: entry.color || defaultColors[index % defaultColors.length],
  }));

  const chartConfig = chartData.reduce<ChartConfig>(
    (acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
        color: entry.fill,
      };
      return acc;
    },
    {
      value: {
        label: "Vehicles",
      },
    } as ChartConfig
  );

  // Show no data state if no data available
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No fleet data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={`mx-auto aspect-square ${heightClass} w-full`}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={compact ? 40 : 60}
          outerRadius={compact ? 80 : 110}
          labelLine={false}
          strokeWidth={2}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
