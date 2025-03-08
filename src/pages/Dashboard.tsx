import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiErrorHandler } from "@/lib/api-error-handler";
import { useContractAlertsData } from "@/hooks/use-contract-alerts-data";
import { useContractActivitiesData } from "@/hooks/use-contract-activities-data";
import { formatDistanceToNow } from 'date-fns';
import { ActivityItemProps } from "@/types/dashboard";
import { AlertTriangle, Bell, Car, TrendingUp, UserPlus, Calendar, BarChart, FileBadge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const { handleError } = useApiErrorHandler();
  const { toast } = useToast();

  useEffect(() => {
    const fleetStatsChannel = supabase
      .channel('fleet-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
          
          // Create a new activity for contract changes
          createContractActivity();
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(fleetStatsChannel);
    };
  }, [queryClient]);

  // Function to create a new activity when contracts are modified
  const createContractActivity = async () => {
    try {
      const { error } = await supabase
        .from("activities")
        .insert({
          title: "Contract updated",
          type: "contract",
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error creating contract activity:", error);
    }
  };

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

      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("status");

      if (contractsError) throw contractsError;

      return {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => v.status === "active").length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter((d) => d.status === "active").length,
        pendingMaintenance: maintenance.filter((m) => m.status === "scheduled").length,
        activeContracts: contracts.filter((c) => c.status === "active").length,
        totalContracts: contracts.length,
      };
    },
  });

  const { data: activitiesData, isLoading: isActivitiesLoading } = useContractActivitiesData(5);
  
  const recentActivities: ActivityItemProps[] = activitiesData ? activitiesData.map((activity) => {
    const formattedTimestamp = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
    
    const getIconForType = (type: string) => {
      switch (type) {
        case "maintenance": return "wrench";
        case "trip": return "car";
        case "vehicle": return "truck";
        case "driver": return "user";
        case "client": return "briefcase";
        case "fuel": return "fuel";
        case "contract": return "contract";
        default: return "activity";
      }
    };
    
    return {
      id: activity.id,
      title: activity.title,
      timestamp: formattedTimestamp,
      type: activity.type,
      icon: getIconForType(activity.type),
    };
  }) : [];

  const { data: alertsData, isLoading: isAlertsLoading } = useContractAlertsData({ resolved: false });
  
  const alerts = alertsData ? alertsData.map((alert) => ({
    id: alert.id,
    title: alert.title,
    priority: alert.priority,
    date: formatDistanceToNow(new Date(alert.date), { addSuffix: true }),
  })) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold mb-2">Fleet Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.totalVehicles || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  {fleetStats?.activeVehicles || 0} currently active
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.totalDrivers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  {fleetStats?.activeDrivers || 0} currently active
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.pendingMaintenance || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span className="flex items-center">
                  {fleetStats?.pendingMaintenance > 0 ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1 animate-pulse"></span>
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  )}
                  Tasks requiring attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileBadge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            {isFleetStatsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fleetStats?.activeContracts || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isFleetStatsLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  {fleetStats?.totalContracts || 0} total contracts
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            {alerts && alerts.length > 0 && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            )}
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {isAlertsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isAlertsLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : alerts && alerts.length > 0 ? (
                <span className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                  {alertsData?.filter((a) => a.priority === "high").length || 0} high priority
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  No active alerts
                </span>
              )}
            </p>
            {alerts && alerts.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 p-0 h-auto text-xs text-red-600 dark:text-red-400"
                onClick={() => navigate('/alerts')}
              >
                View all alerts
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Fleet Overview
                </CardTitle>
                <CardDescription>
                  Vehicle status and utilization for the current month
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Activity & Alerts
              </CardTitle>
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
            <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Activity</TabsTrigger>
                <TabsTrigger value="alerts" className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  Alerts
                  {(alerts && alerts.length > 0) && (
                    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                      {alerts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="space-y-4 mt-4">
                <RecentActivity activities={recentActivities || []} isLoading={isActivitiesLoading} />
              </TabsContent>
              <TabsContent value="alerts" className="space-y-4 mt-4">
                <AlertsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
