"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";
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
  color?: string;
}

interface FleetDistributionChartProps {
  data?: FleetData[];
}

const PALETTE = ["#1D4ED8", "#60A5FA"];

export function FleetDistributionChart({ data = [] }: FleetDistributionChartProps) {
  // If real categories exist, drop the placeholder "Unspecified" slice
  const normalizedData = React.useMemo(() => {
    const hasNamed = (data || []).some(
      (d) => d && d.name && d.name.toLowerCase() !== "unspecified"
    );
    if (hasNamed) {
      return (data || []).filter(
        (d) => d && d.name && d.name.toLowerCase() !== "unspecified"
      );
    }
    return data || [];
  }, [data]);

  const chartData = React.useMemo(
    () =>
      normalizedData.map((entry, index) => ({
        label: entry.name || `Type ${index + 1}`,
        value: entry.value ?? 0,
        fill: PALETTE[index % PALETTE.length],
        id: `fleet-${index}`,
      })),
    [normalizedData]
  );

  const chartConfig = React.useMemo(
    () =>
      chartData.reduce<ChartConfig>(
        (config, slice) => ({
          ...config,
          [slice.id]: {
            label: slice.label,
            color: slice.fill,
          },
        }),
        {
          value: { label: "Vehicles" },
        } as ChartConfig
      ),
    [chartData]
  );

  if (!chartData.length) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No fleet data available
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="id"
          strokeWidth={2}
          fill="#1D4ED8"
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="id" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
