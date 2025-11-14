"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface FuelConsumptionData {
  date: string;
  consumption: number;
  efficiency: number;
}

interface FuelConsumptionChartProps {
  data?: FuelConsumptionData[];
  compact?: boolean;
}

const chartConfig: ChartConfig = {
  consumption: {
    label: "Consumption (L)",
    color: "hsl(var(--chart-1))",
  },
  efficiency: {
    label: "Efficiency (km/L)",
    color: "hsl(var(--chart-2))",
  },
};

export function FuelConsumptionChart({
  data = [],
  compact = false,
}: FuelConsumptionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No fuel data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={`w-full ${compact ? "min-h-[260px]" : "min-h-[340px]"}`}
    >
      <LineChart data={data} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value: number, name) => [
            name === "consumption"
              ? `${value.toLocaleString()} L`
              : `${value.toLocaleString()} km/L`,
            chartConfig[name as keyof typeof chartConfig]?.label ?? name,
          ]}
        />
        <Line
          type="monotone"
          dataKey="consumption"
          stroke="var(--color-consumption)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="efficiency"
          stroke="var(--color-efficiency)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
