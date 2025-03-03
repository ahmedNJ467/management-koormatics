
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { CostsTab } from "@/components/dashboard/CostsTab";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { useDashboardRealtime } from "@/hooks/use-dashboard-realtime";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { generateVehicleStats, generateFinancialStats } from "@/utils/dashboard-stats";
import { useState } from "react";
import { PerformanceMonitor } from "@/components/dashboard/performance/PerformanceMonitor";
import { Cog } from "lucide-react";

export default function Dashboard() {
  // State for showing performance monitor
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  // Use the dashboard data hook to fetch all data
  const {
    recentAlerts,
    upcomingTrips,
    costsBreakdown,
    recentActivities,
    vehicleStats,
    driverStats,
    financialData,
    isLoadingVehicles,
    isLoadingDrivers,
    isLoadingFinancial
  } = useDashboardData();

  // Use the dashboard realtime hook to subscribe to changes
  useDashboardRealtime();

  // Generate stats cards based on fetched data
  const stats = generateVehicleStats(
    { ...vehicleStats, totalDrivers: driverStats?.totalDrivers },
    isLoadingVehicles || isLoadingDrivers
  );

  // Generate financial stats cards
  const financialStats = generateFinancialStats(financialData, isLoadingFinancial);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Fleet management overview and analytics
          </p>
        </div>
        <button 
          className="flex items-center text-sm gap-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        >
          <Cog className="h-4 w-4" />
          {showPerformanceMonitor ? "Hide" : "Show"} Performance Monitor
        </button>
      </div>
      
      {showPerformanceMonitor && (
        <PerformanceMonitor />
      )}
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab 
            stats={stats} 
            financialStats={financialStats} 
            upcomingTrips={upcomingTrips}
            recentActivities={recentActivities}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        
        <TabsContent value="costs">
          <CostsTab costsBreakdown={costsBreakdown} />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsTab recentAlerts={recentAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
