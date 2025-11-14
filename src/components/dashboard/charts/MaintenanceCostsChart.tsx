"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface MaintenanceCostData {
  month: string;
  cost: number;
}

interface MaintenanceCostsChartProps {
  data?: MaintenanceCostData[];
  compact?: boolean;
}

const chartConfig: ChartConfig = {
  cost: {
    label: "Maintenance Cost",
    color: "hsl(var(--chart-3))",
  },
};

export function MaintenanceCostsChart({
  data = [],
  compact = false,
}: MaintenanceCostsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No maintenance data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={`w-full ${compact ? "min-h-[220px]" : "min-h-[300px]"}`}
    >
      <BarChart data={data} margin={{ top: 12, right: 12, left: 6, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
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
          domain={["dataMin", "dataMax"]}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Cost"]}
        />
        <Bar
          dataKey="cost"
          name="Maintenance Cost"
          fill="var(--color-cost)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
