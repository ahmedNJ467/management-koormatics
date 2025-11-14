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

interface DriverStatusData {
  status: string;
  count: number;
}

interface DriverStatusChartProps {
  data?: DriverStatusData[];
  compact?: boolean;
}

const chartConfig: ChartConfig = {
  count: {
    label: "Drivers",
    color: "hsl(var(--chart-2))",
  },
};

export function DriverStatusChart({
  data = [],
  compact = false,
}: DriverStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No driver data available</p>
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
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="status"
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[6, 6, 0, 0]}
          name="Drivers"
        />
      </BarChart>
    </ChartContainer>
  );
}
