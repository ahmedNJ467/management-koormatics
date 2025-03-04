
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { FleetOverviewChart } from "@/components/dashboard/charts/FleetOverviewChart";
import { FinancialOverviewChart } from "@/components/dashboard/charts/FinancialOverviewChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { StatCardProps, TripItemProps, ActivityItemProps } from "@/types/dashboard";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardChartsData } from "@/hooks/use-dashboard-charts-data";

interface OverviewTabProps {
  stats: StatCardProps[];
  financialStats: StatCardProps[];
  upcomingTrips: TripItemProps[];
  recentActivities: ActivityItemProps[];
  isLoading?: boolean;
}

export const OverviewTab = ({ stats, financialStats, upcomingTrips, recentActivities, isLoading = false }: OverviewTabProps) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = useDashboardChartsData(vehicles, drivers, maintenance, fuelLogs);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*');
        
        if (vehiclesError) throw vehiclesError;
        setVehicles(vehiclesData || []);
        
        // Fetch drivers
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*');
        
        if (driversError) throw driversError;
        setDrivers(driversData || []);
        
        // Fetch maintenance
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*');
        
        if (maintenanceError) throw maintenanceError;
        setMaintenance(maintenanceData || []);
        
        // Fetch fuel logs
        const { data: fuelLogsData, error: fuelLogsError } = await supabase
          .from('fuel_logs')
          .select('*');
        
        if (fuelLogsError) throw fuelLogsError;
        setFuelLogs(fuelLogsData || []);
        
      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const renderSkeletonChart = () => (
    <div className="h-[300px] flex items-center justify-center">
      <Skeleton className="h-[250px] w-full" />
    </div>
  );

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
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>
              Monthly vehicle counts and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] p-4">
              {isLoading || loading ? renderSkeletonChart() : (
                <FleetOverviewChart data={chartData.monthlyData} />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Monthly revenue, costs, and profit
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] p-4">
              {isLoading || loading ? renderSkeletonChart() : (
                <FinancialOverviewChart data={chartData.monthlyData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-4 p-4 text-sm font-medium bg-muted/50">
                  <div>Client</div>
                  <div>Destination</div>
                  <div>Date & Time</div>
                  <div>Driver</div>
                </div>
                {upcomingTrips.length > 0 ? (
                  upcomingTrips.map((trip) => (
                    <div key={trip.id} className="grid grid-cols-4 p-4 text-sm border-t">
                      <div className="font-medium">{trip.client}</div>
                      <div>{trip.destination}</div>
                      <div>{trip.date}</div>
                      <div>{trip.driver}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    No upcoming trips scheduled
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <RecentActivities activities={recentActivities} isLoading={isLoading} />
      </div>
    </div>
  );
};
