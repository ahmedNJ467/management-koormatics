"use client";

import { PieLegendCard } from "@/components/charts/PieLegendCard";
import { ChartConfig } from "@/components/ui/chart";

interface FleetData {
  name: string;
  value: number;
  color?: string;
}

interface FleetDistributionChartProps {
  data?: FleetData[];
}

const FLEET_COLORS = ["#1D4ED8", "#60A5FA"];

export function FleetDistributionChart({ data = [] }: FleetDistributionChartProps) {
  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: entry.color || FLEET_COLORS[index % FLEET_COLORS.length],
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

  return (
    <PieLegendCard
      title="Fleet Distribution"
      description="Vehicle mix by type"
      data={chartData}
      config={chartConfig}
      emptyMessage="No fleet data available"
      chartClassName="max-h-[300px]"
    />
  );
}
