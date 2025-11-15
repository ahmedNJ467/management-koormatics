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

export function FleetDistributionChart({ data = [] }: FleetDistributionChartProps) {
  const chartConfig = data.reduce<ChartConfig>(
    (acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
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
      data={data}
      config={chartConfig}
      emptyMessage="No fleet data available"
      chartClassName="max-h-[300px]"
    />
  );
}
