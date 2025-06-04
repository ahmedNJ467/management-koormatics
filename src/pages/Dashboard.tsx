
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ImprovedAlertsTab } from "@/components/dashboard/ImprovedAlertsTab";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { BarChart, AlertTriangle, Activity } from "lucide-react";
import { getActivities, logActivity } from "@/utils/activity-logger";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    };
    
    loadActivities();
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Fleet Management Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time overview of your fleet operations and performance
          </p>
        </div>
        
        {/* Stats */}
        <DashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Fleet Analytics - Larger */}
          <div className="lg:col-span-8">
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <BarChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Fleet Analytics</CardTitle>
                    <CardDescription>
                      Comprehensive performance metrics and insights
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                <EnhancedOverview />
              </CardContent>
            </Card>
          </div>
          
          {/* Activity & Alerts Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Recent Activity */}
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription className="text-sm">
                      Latest system updates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                <div className="max-h-[300px] overflow-y-auto">
                  <RecentActivity activities={recentActivities} isLoading={false} />
                </div>
              </CardContent>
            </Card>
            
            {/* System Alerts */}
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">System Alerts</CardTitle>
                    <CardDescription className="text-sm">
                      Important notifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                <div className="max-h-[300px] overflow-y-auto">
                  <ImprovedAlertsTab />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
