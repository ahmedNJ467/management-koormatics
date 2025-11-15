
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface FuelCostsChartProps {
  data?: Array<{ month: string; diesel: number; petrol: number }>;
}

const chartConfig = {
  diesel: {
    label: "Diesel",
    color: "hsl(var(--chart-2))",
  },
  petrol: {
    label: "Petrol",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export const FuelCostsChart = ({ data = [] }: FuelCostsChartProps) => {
  if (!data.length) {
    return (
      <Card>
        <CardHeader className="items-start pb-0">
          <CardTitle>Fuel Costs</CardTitle>
          <CardDescription>No fuel cost data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add fuel expense records to see this chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-start pb-0">
        <CardTitle>Fuel Costs</CardTitle>
        <CardDescription>Monthly diesel vs petrol spend</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="diesel" fill="var(--color-diesel)" radius={4} />
            <Bar dataKey="petrol" fill="var(--color-petrol)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
