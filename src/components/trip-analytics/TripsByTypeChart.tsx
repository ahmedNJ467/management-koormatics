
import { DisplayTrip } from "@/lib/types/trip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TripsByTypeChartProps {
  trips: DisplayTrip[];
}

export function TripsByTypeChart({ trips }: TripsByTypeChartProps) {
  // Ensure trips is a valid array
  const safeTrips = Array.isArray(trips) ? trips.filter(trip => trip && typeof trip === 'object') : [];
  
  // Count trips by type with enhanced safety checks
  const typeCounts = safeTrips.reduce((acc, trip) => {
    try {
      // Multiple fallbacks for trip type with safety checks
      let type = 'other'; // default value
      
      if (trip.display_type && typeof trip.display_type === 'string') {
        type = trip.display_type;
      } else if (trip.service_type && typeof trip.service_type === 'string') {
        type = trip.service_type;
      } else if (trip.type && typeof trip.type === 'string') {
        type = trip.type;
      }
      
      // Ensure type is a valid string before using as key
      const safeType = String(type || 'unknown');
      acc[safeType] = (acc[safeType] || 0) + 1;
      return acc;
    } catch (error) {
      console.error('Error processing trip for type counting:', error, trip);
      acc['unknown'] = (acc['unknown'] || 0) + 1;
      return acc;
    }
  }, {} as Record<string, number>);
  
  // Convert to array format for chart with safety checks
  const chartData = Object.entries(typeCounts).map(([name, value]) => {
    try {
      return {
        name: formatTypeName(name),
        trips: Number(value) || 0
      };
    } catch (error) {
      console.error('Error formatting chart data:', error, name, value);
      return {
        name: 'Unknown',
        trips: 0
      };
    }
  });
  
  // Sort by count descending
  chartData.sort((a, b) => (b.trips || 0) - (a.trips || 0));

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

function formatTypeName(type: string | undefined | null): string {
  // Enhanced safety checks for undefined/null values
  if (!type) {
    return 'Unknown';
  }
  
  // Ensure we have a string to work with
  const safeType = String(type);
  
  if (!safeType || safeType === 'undefined' || safeType === 'null') {
    return 'Unknown';
  }
  
  try {
    // Format the type name for display with safety checks
    return safeType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => {
        if (!word || typeof word !== 'string') return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .filter(word => word.length > 0) // Remove empty words
      .join(' ') || 'Unknown'; // Fallback if result is empty
  } catch (error) {
    console.error('Error formatting type name:', error, type);
    return 'Unknown';
  }
}
