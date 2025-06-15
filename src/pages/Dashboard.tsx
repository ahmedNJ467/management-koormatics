
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Clean Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Fleet Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time insights and operational management
              </p>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">System Online</span>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <DashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Analytics Section */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Fleet Analytics
                      </CardTitle>
                      <CardDescription>
                        Performance metrics and operational insights
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border">
                    <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedOverview />
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Sidebar */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Live system updates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
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
