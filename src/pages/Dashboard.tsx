import { useState, useEffect, useCallback } from "react";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import RecentTrips from "@/components/dashboard/RecentTrips";
import { useQueryClient } from "@tanstack/react-query";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { realtimeManager } from "@/utils/realtime-manager";
import { ActivityItemProps } from "@/types/dashboard";
import { getActivities, logTripActivity } from "@/utils/activity-logger";
import dynamic from "next/dynamic";
import { useDashboardChartsData } from "@/hooks/use-dashboard-charts-data";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  Wrench,
  Fuel,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
} from "lucide-react";

// Dynamically import charts to avoid SSR layout/measurement issues
const FleetDistributionChart = dynamic(
  () =>
    import("@/components/dashboard/charts/FleetDistributionChart").then(
      (m) => m.FleetDistributionChart
    ),
  { ssr: false }
);

const DriverStatusChart = dynamic(
  () =>
    import("@/components/dashboard/charts/DriverStatusChart").then(
      (m) => m.DriverStatusChart
    ),
  { ssr: false }
);

const FuelConsumptionChart = dynamic(
  () =>
    import("@/components/dashboard/charts/FuelConsumptionChart").then(
      (m) => m.FuelConsumptionChart
    ),
  { ssr: false }
);

const MaintenanceCostsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/MaintenanceCostsChart").then(
      (m) => m.MaintenanceCostsChart
    ),
  { ssr: false }
);

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { domain } = useTenantScope();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(
    []
  );
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Start with false for better UX
  const [dataInitialized, setDataInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const chartData = useDashboardChartsData(
    vehicles,
    drivers,
    maintenance,
    fuelLogs
  );

  // Optimized data fetching with lazy loading
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch data in parallel for better performance
      const [vehiclesResult, driversResult, maintenanceResult, fuelLogsResult] =
        await Promise.all([
          supabase.from("vehicles").select("*"),
          supabase.from("drivers").select("*"),
          supabase.from("maintenance").select("*"),
          supabase.from("fuel_logs").select("*"),
        ]);

      // Check for errors
      if (vehiclesResult.error) throw vehiclesResult.error;
      if (driversResult.error) throw driversResult.error;
      if (maintenanceResult.error) throw maintenanceResult.error;
      if (fuelLogsResult.error) throw fuelLogsResult.error;

      // Set data
      setVehicles(vehiclesResult.data || []);
      setDrivers(driversResult.data || []);
      setMaintenance(maintenanceResult.data || []);
      setFuelLogs(fuelLogsResult.data || []);
      setDataInitialized(true);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy load data after component mounts
  useEffect(() => {
    // Delay data fetching to improve initial render performance
    const timer = setTimeout(() => {
      fetchData();
    }, 100); // Small delay to let the UI render first

    return () => clearTimeout(timer);
  }, [fetchData]);

  // Optimized activities loading
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const activities = await getActivities(5);
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };

    // Load activities immediately but don't block the UI
    loadActivities();

    // Refresh activities less frequently to reduce load
    const intervalId = setInterval(loadActivities, 60000); // Every minute instead of 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Optimized realtime subscriptions with debouncing
  useEffect(() => {
    // Only set up realtime subscriptions after data is initialized
    if (!dataInitialized) return;

    const unsubscribes: (() => void)[] = [];
    let setupTimeout: NodeJS.Timeout;

    // Debounce realtime setup to prevent overwhelming the system
    setupTimeout = setTimeout(() => {
      unsubscribes.push(
        realtimeManager.subscribeToTable("vehicles", async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          // Don't reload activities on every vehicle change
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("drivers", async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("maintenance", async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("contracts", async () => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("trips", async (payload) => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });

          if (
            payload.new &&
            payload.eventType &&
            typeof payload.new === "object" &&
            "id" in payload.new
          ) {
            const tripId = payload.new.id;
            let action = "";

            switch (payload.eventType) {
              case "INSERT":
                action = "created";
                break;
              case "UPDATE":
                action = "updated";
                break;
              case "DELETE":
                action = "deleted";
                break;
            }

            if (action && tripId) {
              await logTripActivity(action, tripId, payload.new);
            }
          }

          // Only reload activities for trip changes
          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      );
    }, 500); // 500ms delay to let the UI settle

    return () => {
      clearTimeout(setupTimeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, dataInitialized]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Welcome to your fleet management overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 border border-border/50 bg-background">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-blue-600">
                Total Vehicles
              </h3>
              <Car className="h-4 w-4 text-blue-600" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold text-blue-600">
                {vehicles?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active fleet vehicles
              </p>
            </div>
          </div>

          <div className="p-6 border border-border/50 bg-background">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-green-600">
                Active Drivers
              </h3>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold text-green-600">
                {drivers?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Available drivers</p>
            </div>
          </div>

          <div className="p-6 border border-border/50 bg-background">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-orange-600">
                Maintenance
              </h3>
              <Wrench className="h-4 w-4 text-orange-600" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold text-orange-600">
                {maintenance?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Service records</p>
            </div>
          </div>

          <div className="p-6 border border-border/50 bg-background">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-purple-600">Fuel Logs</h3>
              <Fuel className="h-4 w-4 text-purple-600" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold text-purple-600">
                {fuelLogs?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Fuel transactions</p>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="grid gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="trips"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Trips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="border border-border/50 bg-background">
                    <div className="p-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Fleet Distribution
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Vehicle types breakdown
                      </p>
                    </div>
                    <div className="h-[350px] w-full">
                      <FleetDistributionChart
                        data={chartData?.fleetDistributionData || []}
                        compact
                      />
                    </div>
                  </div>

                  <div className="border border-border/50 bg-background">
                    <div className="p-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        Driver Status
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Driver availability overview
                      </p>
                    </div>
                    <div className="h-[350px] w-full">
                      <DriverStatusChart
                        data={chartData?.driverStatusData || []}
                        compact
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border/50 bg-background">
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                      <LineChart className="w-5 h-5 text-purple-600" />
                      Fuel Consumption Trends
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Monthly fuel consumption patterns
                    </p>
                  </div>
                  <div className="h-[350px] w-full">
                    <FuelConsumptionChart
                      data={chartData?.fuelConsumptionData || []}
                      compact
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="border border-border/50 bg-background">
                    <div className="p-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                        <Wrench className="w-5 h-5 text-orange-600" />
                        Maintenance Costs
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Monthly maintenance expenditure
                      </p>
                    </div>
                    <div className="h-[350px] w-full">
                      <MaintenanceCostsChart
                        data={chartData?.maintenanceCostsData || []}
                        compact
                      />
                    </div>
                  </div>

                  <div className="border border-border/50 bg-background">
                    <div className="p-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Performance Metrics
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Fleet efficiency indicators
                      </p>
                    </div>
                    <div className="flex items-center justify-center h-[350px]">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Performance analytics coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trips" className="space-y-6">
                <div className="border border-border/50 bg-background">
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      Recent Trips
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Latest trip activities and status
                    </p>
                  </div>
                  <div className="px-6 pb-6">
                    <RecentTrips />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="border border-border/50 bg-background">
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Latest system updates
                </p>
              </div>
              <div className="px-6 pb-6">
                <RecentActivity
                  activities={recentActivities}
                  isLoading={false}
                />
              </div>
            </div>

            <div className="border border-border/50 bg-background">
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Quick Actions
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Common tasks and shortcuts
                </p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
