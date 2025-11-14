
import {
  Bar,
  BarChart,
  CartesianGrid,
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

interface FleetOverviewChartProps {
  data?: Array<{
    month: string;
    vehicles: number;
    maintenance: number;
  }>;
}

const chartConfig: ChartConfig = {
  vehicles: {
    label: "Total Vehicles",
    color: "hsl(var(--chart-1))",
  },
  maintenance: {
    label: "In Maintenance",
    color: "hsl(var(--chart-2))",
  },
};

export const FleetOverviewChart = ({ data = [] }: FleetOverviewChartProps) => {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No fleet overview data available</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
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
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value: number, name) => [
            value.toLocaleString(),
            chartConfig[name as keyof typeof chartConfig]?.label ?? name,
          ]}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="vehicles"
          name="Total Vehicles"
          fill="var(--color-vehicles)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="maintenance"
          name="In Maintenance"
          fill="var(--color-maintenance)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};
