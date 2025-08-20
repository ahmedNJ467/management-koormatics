
import { DisplayTrip } from "@/lib/types/trip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TopClientsChartProps {
  trips: DisplayTrip[];
}

export function TopClientsChart({ trips }: TopClientsChartProps) {
  // Count trips by client
  const clientCounts = trips.reduce((acc, trip) => {
    const clientName = trip.client_name || 'Unknown Client';
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array format for chart and sort by count
  const chartData = Object.entries(clientCounts)
    .map(([name, value]) => ({
      name,
      trips: value
    }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 10); // Show top 10 clients

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
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="trips" fill="#8884d8" name="Number of Trips" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No client data available</p>
        </div>
      )}
    </div>
  );
}
