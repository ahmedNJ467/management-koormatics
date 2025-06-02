
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
import { BarChart, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { getActivities, logActivity } from "@/utils/activity-logger";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>([]);

  useEffect(() => {
    // Initial load of activities
    const loadActivities = async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    };
    
    loadActivities();
    
    // Set up polling interval for activities
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
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Fleet Management Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time overview of your fleet operations and performance
          </p>
        </div>
        
        {/* Quick Stats */}
        <DashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Fleet Analytics Section */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <BarChart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Fleet Analytics</CardTitle>
                      <CardDescription className="text-base">
                        Comprehensive fleet performance metrics and insights
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <EnhancedOverview />
              </CardContent>
            </Card>
          </div>
          
          {/* Activity & Alerts Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                    <CardDescription>
                      Latest system updates and changes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="max-h-[400px] overflow-y-auto">
                  <RecentActivity activities={recentActivities} isLoading={false} />
                </div>
              </CardContent>
            </Card>
            
            {/* System Alerts */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">System Alerts</CardTitle>
                    <CardDescription>
                      Important notifications and warnings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="max-h-[400px] overflow-y-auto">
                  <ImprovedAlertsTab />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Performance Trends */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Performance Trends</CardTitle>
                <CardDescription className="text-base">
                  Track key performance indicators and trends over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Monthly Revenue</div>
                <div className="text-2xl font-bold">+12.5%</div>
                <div className="text-xs text-muted-foreground">vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">Trip Completion</div>
                <div className="text-2xl font-bold">+8.2%</div>
                <div className="text-xs text-muted-foreground">vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Fleet Utilization</div>
                <div className="text-2xl font-bold">+5.7%</div>
                <div className="text-xs text-muted-foreground">vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Cost Efficiency</div>
                <div className="text-2xl font-bold">+3.4%</div>
                <div className="text-xs text-muted-foreground">vs last month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
