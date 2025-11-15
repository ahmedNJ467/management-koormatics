
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
  
  const chartConfig = chartData.reduce<ChartConfig>(
    (acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
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
      data={chartData}
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
