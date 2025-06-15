
import { DisplayTrip } from "@/lib/types/trip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TripsByTypeChartProps {
  trips: DisplayTrip[];
}

export function TripsByTypeChart({ trips }: TripsByTypeChartProps) {
  // Count trips by type with safety checks
  const typeCounts = trips.reduce((acc, trip) => {
    const type = trip.display_type || trip.service_type || 'other';
    // Ensure type is a string before using it as a key
    const safeType = typeof type === 'string' ? type : 'unknown';
    acc[safeType] = (acc[safeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array format for chart with safety checks
  const chartData = Object.entries(typeCounts).map(([name, value]) => ({
    name: formatTypeName(name),
    trips: value
  }));
  
  // Sort by count descending
  chartData.sort((a, b) => b.trips - a.trips);

  return (
    <div className="w-full h-[300px]">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="trips" fill="#8884d8" name="Number of Trips" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No trip type data available</p>
        </div>
      )}
    </div>
  );
}

function formatTypeName(type: string): string {
  // Add safety checks for undefined/null values
  if (!type || typeof type !== 'string') {
    return 'Unknown';
  }
  
  // Format the type name for display
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
