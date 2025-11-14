
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

interface FuelCostsChartProps {
  data?: Array<{
    month: string;
    diesel: number;
    petrol: number;
  }>;
}

const chartConfig: ChartConfig = {
  diesel: {
    label: "Diesel",
    color: "hsl(var(--chart-4))",
  },
  petrol: {
    label: "Petrol",
    color: "hsl(var(--chart-1))",
  },
};

export const FuelCostsChart = ({ data = [] }: FuelCostsChartProps) => {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No fuel cost data available</p>
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
            `$${value.toLocaleString()}`,
            chartConfig[name as keyof typeof chartConfig]?.label ?? name,
          ]}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="diesel"
          name="Diesel"
          fill="var(--color-diesel)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="petrol"
          name="Petrol"
          fill="var(--color-petrol)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};
