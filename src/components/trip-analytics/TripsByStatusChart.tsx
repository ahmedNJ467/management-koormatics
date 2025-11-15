
import { DisplayTrip } from "@/lib/types/trip";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TripsByStatusChartProps {
  trips: DisplayTrip[];
}

export function TripsByStatusChart({ trips }: TripsByStatusChartProps) {
  // Count trips by status
  const statusCounts = trips.reduce((acc, trip) => {
    const status = trip.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array format for chart
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: formatStatusName(name),
    value
  }));
  
  // Colors for different statuses
  const COLORS = {
    'Completed': '#10b981', // green
    'Scheduled': '#3b82f6', // blue
    'In Progress': '#f59e0b', // amber
    'Cancelled': '#ef4444', // red
    'Unknown': '#6b7280', // gray
  };

  const pieData = chartData.map((entry) => ({
    ...entry,
    fill: COLORS[entry.name as keyof typeof COLORS] || "#6b7280",
  }));

  const chartConfig = pieData.reduce<ChartConfig>(
    (acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
        color: entry.fill,
      };
      return acc;
    },
    {
      value: {
        label: "Trips",
      },
    } as ChartConfig
  );

  return (
    <div className="w-full">
      {pieData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[320px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="name" />}
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={110}
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No trip status data available</p>
        </div>
      )}
    </div>
  );
}

function formatStatusName(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'scheduled': return 'Scheduled';
    case 'in_progress': return 'In Progress';
    case 'cancelled': return 'Cancelled';
    default: return 'Unknown';
  }
}
