
import { DisplayTrip } from "@/lib/types/trip";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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

  return (
    <div className="w-full h-[300px]">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} trips`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
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
