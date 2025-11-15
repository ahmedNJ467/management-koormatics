"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DriverStatusData {
  status: string;
  count: number;
}

interface DriverStatusChartProps {
  data?: DriverStatusData[];
}

const PALETTE = ["#1D4ED8", "#60A5FA"];

export function DriverStatusChart({ data = [] }: DriverStatusChartProps) {
  const chartData = React.useMemo(
    () =>
      data.map((entry, idx) => ({
        id: `driver-status-${idx}`,
        label: entry.status || `Status ${idx + 1}`,
        drivers: entry.count ?? 0,
        fill: PALETTE[idx % PALETTE.length],
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
          drivers: {
            label: "Drivers",
          },
        } as ChartConfig
      ),
    [chartData]
  );

  const totalDrivers = React.useMemo(
    () => chartData.reduce((sum, slice) => sum + slice.drivers, 0),
    [chartData]
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Driver Availability</CardTitle>
        <CardDescription>Current driver status mix</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {chartData.length ? (
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
                dataKey="drivers"
                nameKey="id"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalDrivers.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Drivers
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No driver data available
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Two-tone driver availability snapshot
      </CardFooter>
    </Card>
  );
}

