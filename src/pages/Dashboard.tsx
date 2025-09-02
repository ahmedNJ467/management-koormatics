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
import KoormaticsLogo from "@/components/ui/koormatics-logo";
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
  Plus,
  ArrowUpRight,
  ArrowDownRight,
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
  const [loading, setLoading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const chartData = useDashboardChartsData(
    vehicles,
    drivers,
    maintenance,
    fuelLogs
  );

  // Calculate key metrics
  const totalVehicles = vehicles?.length || 0;
  const activeDrivers = drivers?.filter(d => d.status === 'active')?.length || 0;
  const totalDrivers = drivers?.length || 0;
  const pendingMaintenance = maintenance?.filter(m => m.status === 'pending')?.length || 0;
  const totalFuelLogs = fuelLogs?.length || 0;

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
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

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

    loadActivities();
    const intervalId = setInterval(loadActivities, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Optimized realtime subscriptions with debouncing
  useEffect(() => {
    if (!dataInitialized) return;

    const unsubscribes: (() => void)[] = [];
    let setupTimeout: NodeJS.Timeout;

    setupTimeout = setTimeout(() => {
      unsubscribes.push(
        realtimeManager.subscribeToTable("vehicles", async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
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

          const activities = await getActivities(5);
          setRecentActivities(activities);
        })
      );
    }, 500);

    return () => {
      clearTimeout(setupTimeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, dataInitialized]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Welcome to your fleet management overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
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

        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                <p className="text-3xl font-bold text-foreground">{totalVehicles}</p>
                <p className="text-xs text-muted-foreground mt-1">Active fleet vehicles</p>
              </div>
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
                <p className="text-3xl font-bold text-foreground">{activeDrivers}</p>
                <p className="text-xs text-muted-foreground mt-1">of {totalDrivers} total</p>
              </div>
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-50 dark:bg-green-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Maintenance</p>
                <p className="text-3xl font-bold text-foreground">{pendingMaintenance}</p>
                <p className="text-xs text-muted-foreground mt-1">Service requests</p>
              </div>
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
                <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-orange-50 dark:bg-orange-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuel Transactions</p>
                <p className="text-3xl font-bold text-foreground">{totalFuelLogs}</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3">
                <Fuel className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-50 dark:bg-purple-900/10"></div>
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
              <TabsList className="grid w-full grid-cols-3 bg-card p-1 shadow-sm border border-border">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="trips"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Trips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="mb-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Fleet Distribution
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Vehicle types breakdown
                      </p>
                    </div>
                    <div className="h-[300px] w-full">
                      <FleetDistributionChart
                        data={chartData?.fleetDistributionData || []}
                        compact
                      />
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="mb-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Driver Status
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Driver availability overview
                      </p>
                    </div>
                    <div className="h-[300px] w-full">
                      <DriverStatusChart
                        data={chartData?.driverStatusData || []}
                        compact
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                      <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Fuel Consumption Trends
                    </h3>
                    <p className="text-muted-foreground text-sm">
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

              <TabsContent value="analytics" className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="mb-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                        <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        Maintenance Costs
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Monthly maintenance expenditure
                      </p>
                    </div>
                    <div className="h-[300px] w-full">
                      <MaintenanceCostsChart
                        data={chartData?.maintenanceCostsData || []}
                        compact
                      />
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="mb-6">
                      <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Performance Metrics
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Fleet efficiency indicators
                      </p>
                    </div>
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Performance analytics coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trips" className="space-y-8">
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                      <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Recent Trips
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Latest trip activities and status
                    </p>
                  </div>
                  <div>
                    <RecentTrips />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Recent Activity
                </h3>
                <p className="text-muted-foreground text-sm">
                  Latest system updates
                </p>
              </div>
              <div>
                <RecentActivity
                  activities={recentActivities}
                  isLoading={false}
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-foreground text-lg font-semibold">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Quick Actions
                </h3>
                <p className="text-muted-foreground text-sm">
                  Common tasks and shortcuts
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 border-border hover:bg-muted"
                  size="sm"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 border-border hover:bg-muted"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 border-border hover:bg-muted"
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
