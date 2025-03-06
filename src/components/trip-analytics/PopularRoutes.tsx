
import { DisplayTrip } from "@/lib/types/trip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PopularRoutesProps {
  trips: DisplayTrip[];
}

export function PopularRoutes({ trips }: PopularRoutesProps) {
  // Create a map of routes and their counts
  const routeCounts: Record<string, { count: number, revenue: number }> = {};
  
  trips.forEach(trip => {
    const pickup = trip.pickup_location || 'Unknown';
    const dropoff = trip.dropoff_location || 'Unknown';
    const route = `${pickup} to ${dropoff}`;
    
    if (!routeCounts[route]) {
      routeCounts[route] = { count: 0, revenue: 0 };
    }
    
    routeCounts[route].count += 1;
    routeCounts[route].revenue += (trip.amount || 0);
  });
  
  // Convert to array and sort by count
  const routeData = Object.entries(routeCounts)
    .map(([route, data]) => ({
      route,
      trips: data.count,
      revenue: data.revenue,
      avgRevenue: data.revenue / data.count
    }))
    .filter(route => route.route !== 'Unknown to Unknown') // Filter out unknown routes
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 10); // Top 10 routes

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Popular Routes</CardTitle>
        <CardDescription>Top 10 routes by trip frequency</CardDescription>
      </CardHeader>
      <CardContent>
        {routeData.length > 0 ? (
          <Table>
            <TableCaption>Top 10 most frequent trip routes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Avg. Revenue/Trip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeData.map((route, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{route.route}</TableCell>
                  <TableCell className="text-right">{route.trips}</TableCell>
                  <TableCell className="text-right">${route.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${route.avgRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No route data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
