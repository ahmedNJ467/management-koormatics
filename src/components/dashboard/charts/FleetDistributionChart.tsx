"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const chartData = React.useMemo(
    () =>
      data.map((entry, index) => ({
        label: entry.name || `Type ${index + 1}`,
        value: entry.value ?? 0,
        fill: PALETTE[index % PALETTE.length],
        id: `fleet-${index}`,
      })),
    [data]
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Fleet Distribution</CardTitle>
        <CardDescription>Vehicle mix by type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {chartData.length ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="label" strokeWidth={2} />
              <ChartLegend
                content={<ChartLegendContent nameKey="label" />}
                className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-muted-foreground">
            No fleet data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
