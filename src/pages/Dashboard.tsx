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
import { Alert } from "@/types/alert";
import { useAlertsData } from "@/hooks/use-alerts-data";
import { useActivitiesData } from "@/hooks/use-activities-data";
import { formatDistanceToNow } from 'date-fns';
import { ActivityItemProps } from "@/types/dashboard";
import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
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
        pendingMaintenance: maintenance.filter((m) => m.status === "scheduled").length,
      };
    },
  });

  // Fetch real activities data from the activities table
  const { data: activitiesData, isLoading: isActivitiesLoading } = useActivitiesData(5);
  
  // Transform activities data for the component
  const recentActivities: ActivityItemProps[] = activitiesData ? activitiesData.map((activity) => {
    const formattedTimestamp = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
    
    // Add the required icon property based on the activity type
    const getIconForType = (type: string) => {
      switch (type) {
        case "maintenance": return "wrench";
        case "trip": return "car";
        case "vehicle": return "truck";
        case "driver": return "user";
        case "client": return "briefcase";
        case "fuel": return "fuel";
        default: return "activity";
      }
    };
    
    return {
      id: Number(activity.id), // Converting to number as expected by ActivityItemProps
      title: activity.title,
      timestamp: formattedTimestamp,
      type: activity.type,
      icon: getIconForType(activity.type),
    };
  }) : [];

  // Fetch real alerts data from the alerts table (only active alerts)
  const { data: alertsData, isLoading: isAlertsLoading } = useAlertsData({ resolved: false });
  
  // Transform alerts data for the component
  const alerts = alertsData ? alertsData.map((alert) => ({
    id: Number(alert.id), // Converting to number as expected by AlertItemProps
    title: alert.title,
    priority: alert.priority,
    date: formatDistanceToNow(new Date(alert.date), { addSuffix: true }),
  })) : [];

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
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            {alerts && alerts.length > 0 && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            )}
          </CardHeader>
          <CardContent>
            {isAlertsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isAlertsLoading ? (
                <Skeleton className="h-4 w-28 mt-1" />
              ) : alerts && alerts.length > 0 ? (
                `${alerts.filter((a) => a.priority === "high").length} high priority`
              ) : (
                "No active alerts"
              )}
            </p>
            {alerts && alerts.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 p-0 h-auto text-xs text-blue-500"
                onClick={() => navigate('/alerts')}
              >
                View all alerts
              </Button>
            )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity & Alerts</CardTitle>
              <CardDescription>
                Recent system activities and important alerts
              </CardDescription>
            </div>
            {(alerts && alerts.length > 0) && (
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {alerts.length}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="alerts" className="relative">
                  Alerts
                  {(alerts && alerts.length > 0) && (
                    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                      {alerts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="space-y-4">
                <RecentActivity activities={recentActivities || []} isLoading={isActivitiesLoading} />
              </TabsContent>
              <TabsContent value="alerts" className="space-y-4">
                <AlertsTab recentAlerts={alerts || []} isLoading={isAlertsLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
