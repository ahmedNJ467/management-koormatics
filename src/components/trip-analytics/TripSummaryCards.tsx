
import { DisplayTrip } from "@/lib/types/trip";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  CreditCard, 
  Car, 
  User, 
  Calendar 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TripSummaryCardsProps {
  trips: DisplayTrip[];
}

export function TripSummaryCards({ trips }: TripSummaryCardsProps) {
  // Count trips by status
  const completedTrips = trips.filter(trip => trip.status === 'completed').length;
  const scheduledTrips = trips.filter(trip => trip.status === 'scheduled').length;
  const inProgressTrips = trips.filter(trip => trip.status === 'in_progress').length;
  const cancelledTrips = trips.filter(trip => trip.status === 'cancelled').length;
  
  // Calculate total revenue from all trips
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.amount || 0), 0);
  
  // Count unique vehicles, drivers, clients
  const uniqueVehicles = new Set(trips.map(trip => trip.vehicle_id)).size;
  const uniqueDrivers = new Set(trips.map(trip => trip.driver_id)).size;
  const uniqueClients = new Set(trips.map(trip => trip.client_id)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{trips.length}</div>
          <div className="text-xs text-muted-foreground">
            {completedTrips} completed, {scheduledTrips} scheduled
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            From {trips.length} trips
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueVehicles} vehicles</div>
          <div className="text-xs text-muted-foreground">
            {uniqueDrivers} drivers assigned
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Client Base</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueClients} clients</div>
          <div className="text-xs text-muted-foreground">
            Average {(trips.length / uniqueClients).toFixed(1)} trips per client
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
