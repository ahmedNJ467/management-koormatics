
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { FleetOverviewChart } from "@/components/dashboard/charts/FleetOverviewChart";
import { FinancialOverviewChart } from "@/components/dashboard/charts/FinancialOverviewChart";
import { StatCardProps, TripItemProps } from "@/types/dashboard";
import { Calendar } from "lucide-react";

interface OverviewTabProps {
  stats: StatCardProps[];
  financialStats: StatCardProps[];
  upcomingTrips: TripItemProps[];
}

export const OverviewTab = ({ stats, financialStats, upcomingTrips }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {financialStats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FleetOverviewChart />
        <FinancialOverviewChart />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming Trips
          </CardTitle>
          <CardDescription>
            Scheduled trips for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 p-4 text-sm font-medium bg-muted/50">
              <div>Client</div>
              <div>Destination</div>
              <div>Date & Time</div>
              <div>Driver</div>
            </div>
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="grid grid-cols-4 p-4 text-sm border-t">
                <div className="font-medium">{trip.client}</div>
                <div>{trip.destination}</div>
                <div>{trip.date}</div>
                <div>{trip.driver}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
