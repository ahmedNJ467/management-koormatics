
import { DisplayTrip } from "@/lib/types/trip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from "recharts";
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface MonthlyTripChartProps {
  trips: DisplayTrip[];
}

export function MonthlyTripChart({ trips }: MonthlyTripChartProps) {
  // Get the date range from trips
  const tripDates = trips.map(trip => parseISO(trip.date));
  const oldestDate = new Date(Math.min(...tripDates.map(date => date.getTime())));
  const newestDate = new Date(Math.max(...tripDates.map(date => date.getTime())));
  
  // Generate month intervals
  const monthIntervals = eachMonthOfInterval({
    start: startOfMonth(oldestDate),
    end: endOfMonth(newestDate)
  });
  
  // Generate monthly data
  const monthlyData = monthIntervals.map(monthStart => {
    const monthEnd = endOfMonth(monthStart);
    const monthName = format(monthStart, 'MMM yyyy');
    
    // Count trips in this month
    const monthTrips = trips.filter(trip => {
      const tripDate = parseISO(trip.date);
      return isWithinInterval(tripDate, { start: monthStart, end: monthEnd });
    });
    
    // Calculate total revenue for this month
    const revenue = monthTrips.reduce((sum, trip) => sum + (trip.amount || 0), 0);
    
    return {
      month: monthName,
      trips: monthTrips.length,
      revenue
    };
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="volume">
        <TabsList className="mb-4">
          <TabsTrigger value="volume">Trip Volume</TabsTrigger>
          <TabsTrigger value="revenue">Trip Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="volume" className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} trips`, 'Count']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="trips"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Trip Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="revenue" className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
