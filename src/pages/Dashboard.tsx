import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { MessageCenter } from "@/components/communication/MessageCenter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiErrorHandler } from "@/lib/api-error-handler";
import { ActivityItemProps } from "@/types/dashboard";
import { AlertTriangle, Bell, Car, TrendingUp, UserPlus, Calendar, BarChart, FileBadge, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getActivities, logActivity } from "@/utils/activity-logger";
import { Alert } from "@/types/alert";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const { handleError } = useApiErrorHandler();
  const { toast } = useToast();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>([]);

  useEffect(() => {
    // Initial load of activities
    const loadActivities = async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    };
    
    loadActivities();
    
    // Set up polling interval
    const intervalId = setInterval(async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fleetStatsChannel = supabase
      .channel('fleet-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, 
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          await logActivity({
            title: "Vehicle status updated",
            type: "vehicle"
          });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, 
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          await logActivity({
            title: "Driver information updated",
            type: "driver"
          });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' }, 
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          await logActivity({
            title: "Maintenance record updated",
            type: "maintenance"
          });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, 
        async () => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
          await logActivity({
            title: "Contract information updated",
            type: "contract"
          });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(fleetStatsChannel);
    };
  }, [queryClient]);

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

  // Query for active alerts
  const { data: alertsData, isLoading: isAlertsLoading } = useQuery({
    queryKey: ["active-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Alert[];
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold mb-2">Fleet Dashboard</h1>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Fleet Overview Section */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Fleet Overview
                </CardTitle>
                <CardDescription>
                  Real-time analytics and performance metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Tabs defaultValue="enhanced" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
                <TabsTrigger value="classic">Classic</TabsTrigger>
              </TabsList>
              <TabsContent value="enhanced">
                <EnhancedOverview />
              </TabsContent>
              <TabsContent value="classic">
                <Overview />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Activity & Communication Section - Fixed spacing */}
        <Card className="lg:col-span-1 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Activity & Communication
              </CardTitle>
              <CardDescription>
                Recent activities, alerts, and messages
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 mb-4">
                <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 text-xs">
                  Activity
                </TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 text-xs">
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="messages" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Messages
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-0 space-y-3">
                <div className="min-h-[350px]">
                  <RecentActivity activities={recentActivities} isLoading={false} />
                </div>
              </TabsContent>
              <TabsContent value="alerts" className="mt-0 space-y-3">
                <div className="min-h-[350px]">
                  <AlertsTab />
                </div>
              </TabsContent>
              <TabsContent value="messages" className="mt-0 space-y-3">
                <div className="min-h-[350px] -mx-6 -mb-6">
                  <MessageCenter />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
