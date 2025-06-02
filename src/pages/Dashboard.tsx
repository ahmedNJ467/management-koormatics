
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Overview } from "@/components/dashboard/Overview";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ImprovedAlertsTab } from "@/components/dashboard/ImprovedAlertsTab";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { BarChart, MessageCircle, Menu, X } from "lucide-react";
import { getActivities, logActivity } from "@/utils/activity-logger";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // Send event to parent layout to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggleSidebar'));
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fleet Dashboard
          </h1>
        </div>
      </div>
      
      {/* Stats Section */}
      <DashboardStats />
      
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-5">
        {/* Fleet Overview Section */}
        <Card className="xl:col-span-3 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <BarChart className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Fleet Overview
                </CardTitle>
                <CardDescription className="text-base">
                  Real-time analytics and performance metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <Tabs defaultValue="enhanced" className="w-full">
              <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="enhanced" className="px-6">Enhanced</TabsTrigger>
                <TabsTrigger value="classic" className="px-6">Classic</TabsTrigger>
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
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center text-xl">
                <MessageCircle className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                Activity & Communication
              </CardTitle>
              <CardDescription className="text-base">
                Recent activities and alerts
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 mb-6">
                <TabsTrigger value="activity" className="text-sm">
                  Activity
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-sm">
                  Alerts
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-0">
                <div className="min-h-[400px]">
                  <RecentActivity activities={recentActivities} isLoading={false} />
                </div>
              </TabsContent>
              <TabsContent value="alerts" className="mt-0">
                <div className="min-h-[400px]">
                  <ImprovedAlertsTab />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
