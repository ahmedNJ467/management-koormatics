
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface FinancialOverviewChartProps {
  data?: Array<{
    month: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  costs: {
    label: "Costs",
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3))",
  },
};

export const FinancialOverviewChart = ({
  data = [],
}: FinancialOverviewChartProps) => {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No financial data available</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
      <LineChart data={data} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
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
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value: number, name) => [
            `$${value.toLocaleString()}`,
            chartConfig[name as keyof typeof chartConfig]?.label ?? name,
          ]}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="costs"
          stroke="var(--color-costs)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="var(--color-profit)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
};
