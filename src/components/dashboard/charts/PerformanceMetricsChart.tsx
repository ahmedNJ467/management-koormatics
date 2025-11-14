"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface PerformanceMetric {
  name: string;
  value: number;
  color?: string;
}

interface PerformanceMetricsChartProps {
  data?: PerformanceMetric[];
  compact?: boolean;
}

const DEFAULT_COLOR = "hsl(var(--chart-1))";

export function PerformanceMetricsChart({
  data = [],
  compact = false,
}: PerformanceMetricsChartProps) {
  const metric = data[0];

  if (!metric) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No performance data available</p>
        </div>
      </div>
    );
  }

  const value = Math.max(0, Math.min(100, Math.round(metric.value)));
  const chartData = [
    {
      name: metric.name || "Metric",
      value,
      fill: metric.color || DEFAULT_COLOR,
    },
  ];

  const chartConfig: ChartConfig = {
    performance: {
      label: metric.name || "Metric",
      color: metric.color || DEFAULT_COLOR,
    },
  };

  return (
    <div className="relative flex w-full justify-center">
      <ChartContainer
        config={chartConfig}
        className={`w-full max-w-sm ${
          compact ? "h-[220px]" : "h-[260px]"
        }`}
      >
        <RadialBarChart
          data={chartData}
          innerRadius={compact ? 60 : 70}
          outerRadius={compact ? 90 : 110}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            background
            cornerRadius={12}
            fill="var(--color-performance)"
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(val: number) => [`${val}%`, metric.name]}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold">{value}%</span>
        <span className="text-sm text-muted-foreground">
          {metric.name || "Metric"}
        </span>
      </div>
    </div>
  );
}
