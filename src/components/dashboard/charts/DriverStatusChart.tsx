"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
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

const STATUS_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const slugify = (value: string, fallback: string) => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || fallback;
};

export function DriverStatusChart({ data = [] }: DriverStatusChartProps) {
  const normalizedData = React.useMemo(() => {
    return data.map((entry, index) => {
      const statusLabel = entry.status || `Status ${index + 1}`;
      const statusKey = slugify(statusLabel, `status-${index}`);
      const colorToken = STATUS_COLORS[index % STATUS_COLORS.length];

      return {
        statusLabel,
        statusKey,
        drivers: entry.count ?? 0,
        fill: `var(--color-${statusKey})`,
        colorToken,
      };
    });
  }, [data]);

  const chartConfig = React.useMemo(() => {
    return normalizedData.reduce<ChartConfig>(
      (acc, entry) => {
        acc[entry.statusKey] = {
          label: entry.statusLabel,
          color: entry.colorToken,
        };
        return acc;
      },
      {
        drivers: {
          label: "Drivers",
        },
      } as ChartConfig
    );
  }, [normalizedData]);

  const totalDrivers = React.useMemo(
    () => normalizedData.reduce((acc, curr) => acc + curr.drivers, 0),
    [normalizedData]
  );

  const topStatus = React.useMemo(() => {
    if (!normalizedData.length) return null;
    return normalizedData.reduce((top, entry) =>
      entry.drivers > (top?.drivers ?? -1) ? entry : top
    );
  }, [normalizedData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Driver Availability</CardTitle>
        <CardDescription>Current driver status mix</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {normalizedData.length ? (
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
                data={normalizedData}
                dataKey="drivers"
                nameKey="statusKey"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (
                      viewBox &&
                      "cx" in viewBox &&
                      "cy" in viewBox &&
                      totalDrivers !== undefined
                    ) {
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
      <CardFooter className="flex-col gap-2 text-sm">
        {normalizedData.length ? (
          <>
            <div className="flex items-center gap-2 leading-none font-medium">
              {topStatus
                ? `${topStatus.statusLabel} leads with ${
                    totalDrivers > 0
                      ? ((topStatus.drivers / totalDrivers) * 100).toFixed(1)
                      : 0
                  }% of drivers`
                : "Driver distribution updated"}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Tracking availability in real time
            </div>
          </>
        ) : (
          <div className="text-muted-foreground leading-none">
            Waiting for driver status updates
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
