
import { DisplayTrip } from "@/lib/types/trip";
import { PieLegendCard } from "@/components/charts/PieLegendCard";
import { ChartConfig } from "@/components/ui/chart";

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
    <PieLegendCard
      title="Trips by Status"
      description="Distribution of trips by current status"
      data={pieData}
      config={chartConfig}
      emptyMessage="No trip status data available"
    />
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
