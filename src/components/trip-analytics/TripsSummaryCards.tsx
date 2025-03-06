
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CircleDollarSign, Car } from "lucide-react";
import { TripMetrics } from "./utils/trip-calculations";

interface TripsSummaryCardsProps {
  metrics: TripMetrics;
}

export function TripsSummaryCards({ metrics }: TripsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-0">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <CardDescription>All time</CardDescription>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTrips.toLocaleString()}</div>
          {metrics.tripTrend > 0 ? (
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              +{metrics.tripTrend}% from previous period
            </p>
          ) : (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              {metrics.tripTrend}% from previous period
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-0">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <CardDescription>Per trip</CardDescription>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageDuration} hrs</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {metrics.tripsWithDuration} trips with duration data
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CardDescription>All trips</CardDescription>
          </div>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg ${metrics.averageRevenue} per trip
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-0">
            <CardTitle className="text-sm font-medium">Vehicle Utilization</CardTitle>
            <CardDescription>Top vehicles</CardDescription>
          </div>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.vehicleUtilization}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.mostUsedVehicle}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
