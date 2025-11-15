"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DriverStatusData {
  status: string;
  count: number;
}

interface DriverStatusChartProps {
  data?: DriverStatusData[];
  compact?: boolean;
}

const chartConfig = {
  count: {
    label: "Drivers",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DriverStatusChart({
  data = [],
  compact = false,
}: DriverStatusChartProps) {
  const chartHeight = compact ? "h-[220px]" : "h-[300px]";

  if (!data.length) {
    return (
      <Card>
        <CardHeader className="items-start pb-0">
          <CardTitle>Driver Status</CardTitle>
          <CardDescription>No driver data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add driver assignments to see this chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-start pb-0">
        <CardTitle>Driver Status</CardTitle>
        <CardDescription>Drivers by availability</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={chartConfig}
          className={`${chartHeight} w-full`}
        >
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
