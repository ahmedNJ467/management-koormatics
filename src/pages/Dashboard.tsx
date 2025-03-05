import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedQuery } from "@/hooks/use-optimized-query";
import { useApiErrorHandler } from "@/lib/api-error-handler";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { handleError } = useApiErrorHandler();

  // Fetch fleet statistics
  const { data: fleetStats, isLoading: isFleetStatsLoading } = useQuery({
    queryKey: ["fleet-stats"],
    queryFn: async () => {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("status");

      if (vehiclesError) throw vehiclesError;

      const { data: drivers, error: driversError } = await supabase
        .from("drivers")
        .select("status");

      if (driversError) throw driversError;

      const { data: maintenance, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("status");

      if (maintenanceError) throw maintenanceError;

      return {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => v.status === "active").length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter((d) => d.status === "active").length,
        pendingMaintenance: maintenance.filter((m) => m.status === "pending").length,
      };
    },
  });

  // Fetch recent activities
  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch alerts using the optimized query hook
  const { data: alerts = [], isLoading: isAlertsLoading } = useOptimizedQuery(
    ["alerts"],
    async () => {
      try {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        return data.map((alert) => ({
          id: alert.id,
          title: alert.message,
          priority: alert.priority,
          date: new Date(alert.created_at).toLocaleDateString(),
        }));
      } catch (error) {
        throw handleError(error, "Failed to load alerts");
      }
    },
    {
      errorMessage: "Could not load alerts data",
    }
  );

  // Example usage of optimized query for dashboard stats
  const { data: optimizedData, isLoading: isOptimizedLoading } = useOptimizedQuery(
    ["dashboard-stats"],
    async () => {
      try {
        // Your fetch logic here
        return {};
      } catch (error) {
        throw handleError(error, "Failed to load dashboard statistics");
      }
    },
    {
      errorMessage: "Could not load dashboard data",
    }
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.totalVehicles || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : (
                `${fleetStats?.activeVehicles || 0} currently active`
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.totalDrivers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : (
                `${fleetStats?.activeDrivers || 0} currently active`
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.pendingMaintenance || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : (
                "Tasks requiring attention"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {isAlertsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{alerts.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isAlertsLoading ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : (
                `${alerts.filter((a) => a.priority === "high").length} high priority`
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>
              Vehicle status and utilization for the current month
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Activity & Alerts</CardTitle>
            <CardDescription>
              Recent system activities and important alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="space-y-4">
                <RecentActivity activities={recentActivities} isLoading={isActivitiesLoading} />
              </TabsContent>
              <TabsContent value="alerts" className="space-y-4">
                <AlertsTab recentAlerts={alerts} isLoading={isAlertsLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
