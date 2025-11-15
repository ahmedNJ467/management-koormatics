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

interface MaintenanceCostData {
  month: string;
  cost: number;
}

interface MaintenanceCostsChartProps {
  data?: MaintenanceCostData[];
  compact?: boolean;
}

const chartConfig = {
  cost: {
    label: "Maintenance Cost",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function MaintenanceCostsChart({
  data = [],
  compact = false,
}: MaintenanceCostsChartProps) {
  const chartData = data.map((item) => ({
    month: item.month,
    cost: item.cost,
  }));
  const chartHeight = compact ? "h-[220px]" : "h-[300px]";

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader className="items-start pb-0">
          <CardTitle>Maintenance Costs</CardTitle>
          <CardDescription>No maintenance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add maintenance records to see this chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-start pb-0">
        <CardTitle>Maintenance Costs</CardTitle>
        <CardDescription>Monthly maintenance spend</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={chartConfig}
          className={`${chartHeight} w-full`}
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
