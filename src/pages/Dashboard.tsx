
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { BarChart, Activity, TrendingUp } from "lucide-react";
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
    
    // Refresh activities every 30 seconds instead of 15 to reduce load
    const intervalId = setInterval(async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Create a single channel for all fleet data changes
    const fleetChannel = supabase
      .channel('fleet-data-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, async () => {
        queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        await logActivity({
          title: "Vehicle status updated",
          type: "vehicle"
        });
        const activities = await getActivities(5);
        setRecentActivities(activities);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'drivers' 
      }, async () => {
        queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        await logActivity({
          title: "Driver information updated",
          type: "driver"
        });
        const activities = await getActivities(5);
        setRecentActivities(activities);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance' 
      }, async () => {
        queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        await logActivity({
          title: "Maintenance record updated",
          type: "maintenance"
        });
        const activities = await getActivities(5);
        setRecentActivities(activities);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contracts' 
      }, async () => {
        queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
        await logActivity({
          title: "Contract information updated",
          type: "contract"
        });
        const activities = await getActivities(5);
        setRecentActivities(activities);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Dashboard realtime subscribed successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Dashboard realtime subscription error');
        } else if (status === 'CLOSED') {
          console.log('Dashboard realtime subscription closed');
        }
      });
    
    return () => {
      console.log('Cleaning up dashboard realtime subscription');
      supabase.removeChannel(fleetChannel);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-2xl"></div>
          <div className="relative p-8 rounded-2xl border border-white/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Fleet Command Center
                </h1>
                <p className="text-lg text-muted-foreground">
                  Real-time insights and operational excellence at your fingertips
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Stats */}
        <div className="relative">
          <DashboardStats />
        </div>
        
        {/* Main Content Grid with Better Spacing */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Fleet Analytics - Enhanced */}
          <div className="lg:col-span-8">
            <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
              <CardHeader className="relative pb-4 border-b border-gray-200/20 dark:border-gray-700/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                      <BarChart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Fleet Analytics
                      </CardTitle>
                      <CardDescription className="text-base">
                        Comprehensive performance metrics and operational insights
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Live Data</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-8">
                <EnhancedOverview />
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Recent Activity - Enhanced */}
            <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
              <CardHeader className="relative pb-4 border-b border-gray-200/20 dark:border-gray-700/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      Live Activity
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Real-time system updates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                <div className="max-h-[350px] overflow-y-auto space-y-1">
                  <RecentActivity activities={recentActivities} isLoading={false} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
