
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { MessageCenter } from "@/components/communication/MessageCenter";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { BarChart, MessageCircle } from "lucide-react";
import { getActivities, logActivity } from "@/utils/activity-logger";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
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
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold mb-2">Fleet Dashboard</h1>
      
      {/* Stats Section */}
      <DashboardStats />
      
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
        
        {/* Activity & Communication Section */}
        <Card className="lg:col-span-1 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
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
