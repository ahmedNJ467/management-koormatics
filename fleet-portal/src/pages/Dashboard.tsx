import { useState, useEffect } from "react";
import { LazyRecentActivity, LazyWrapper } from "@/components/LazyWrapper";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { realtimeManager } from "@/utils/realtime-manager";
import { ActivityItemProps } from "@/types/dashboard";
import { getActivities, logTripActivity } from "@/utils/activity-logger";
import dynamic from "next/dynamic";
import { useDashboardChartsData } from "@/hooks/use-dashboard-charts-data";
import { useMaintenanceData } from "@/hooks/use-maintenance-data";
import { supabase } from "@/integrations/supabase/client";
import {
  DashboardSkeleton,
  ChartSkeleton,
} from "@/components/ui/loading-skeleton";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";
import { Button } from "@/components/ui/button";
import { Car, Users, Wrench, Fuel } from "lucide-react";

// Dynamically import charts to avoid SSR layout/measurement issues

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

const PerformanceMetricsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/PerformanceMetricsChart").then(
      (m) => m.PerformanceMetricsChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

export default function Dashboard() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  const { domain, isAllowed, loading: tenantLoading } = useTenantScope();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(
    []
  );

  // Performance monitoring - call at the top level
  const { markRenderStart, markRenderEnd } = usePerformanceMonitor("Dashboard");

  // Use data hooks for all data fetching
  const { data: maintenance = [], isLoading: maintenanceLoading } =
    useMaintenanceData();

  // Fetch other data using React Query with optimized settings
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration, status, created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, status, created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: fuelLogs = [], isLoading: fuelLogsLoading } = useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("id, date, volume, cost, fuel_type, vehicle_id, created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const loading =
    vehiclesLoading || driversLoading || fuelLogsLoading || maintenanceLoading;

  const chartData = useDashboardChartsData(
    vehicles,
    drivers,
    maintenance,
    fuelLogs
  );

  // Ensure component is mounted on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
    // Always call useEffect, but conditionally execute logic inside
    if (loading) {
      return;
    }

    const unsubscribes: (() => void)[] = [];

    const setupTimeout = setTimeout(() => {
      unsubscribes.push(
        realtimeManager.subscribeToTable("vehicles", async () => {
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("drivers", async () => {
          queryClient.invalidateQueries({ queryKey: ["drivers"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("maintenance", async () => {
          queryClient.invalidateQueries({ queryKey: ["maintenance"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("fuel_logs", async () => {
          queryClient.invalidateQueries({ queryKey: ["fuel_logs"] });
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
  }, [queryClient, loading]);

  // Performance monitoring - consolidated into single useEffect
  useEffect(() => {
    markRenderStart();
    return () => {
      markRenderEnd();
    };
  }, [markRenderStart, markRenderEnd]);

  // Calculate key metrics
  const totalVehicles = vehicles?.length || 0;
  const activeDrivers =
    drivers?.filter((d) => d.status === "active")?.length || 0;
  const totalDrivers = drivers?.length || 0;
  const pendingMaintenance =
    maintenance?.filter((m) => m.status === "scheduled")?.length || 0;
  const totalFuelLogs = fuelLogs?.length || 0;

  // Calculate meaningful performance metrics
  // Maintenance metrics are available in chartData if needed

  // Calculate fleet utilization - vehicles with active drivers vs total vehicles
  const fleetUtilization =
    totalVehicles > 0 ? Math.round((activeDrivers / totalVehicles) * 100) : 0;

  const performanceMetrics = [
    {
      name: "Fleet Utilization",
      value: fleetUtilization,
      color:
        fleetUtilization >= 80
          ? "#10b981"
          : fleetUtilization >= 60
          ? "#f59e0b"
          : "#ef4444",
    },
  ];

  // ALL HOOKS HAVE BEEN CALLED - NOW HANDLE CONDITIONAL RENDERING
  // Use single return with conditional rendering to prevent unmounting
  // Handle conditional rendering - but always render the same structure
  if (!mounted || loading) {
    return <DashboardSkeleton />;
  }

  if (!isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this tenant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header Section */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vehicles</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalVehicles}
                </p>
              </div>
              <Car className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-semibold text-foreground">
                  {activeDrivers}/{totalDrivers}
                </p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-semibold text-foreground">
                  {pendingMaintenance}
                </p>
              </div>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Logs</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalFuelLogs}
                </p>
              </div>
              <Fuel className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-6">
            <div className="space-y-6">
              <div className="bg-card border border-border p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Fuel Consumption
                </h3>
                <div className="h-[300px] w-full">
                  <LazyWrapper fallback={<ChartSkeleton height="h-[300px]" />}>
                    <FuelConsumptionChart
                      data={chartData?.fuelConsumptionData || []}
                      compact
                    />
                  </LazyWrapper>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground mb-4">
                    Maintenance Costs
                  </h3>
                  <div className="h-[250px] w-full">
                    <LazyWrapper
                      fallback={<ChartSkeleton height="h-[250px]" />}
                    >
                      <MaintenanceCostsChart
                        data={chartData?.maintenanceCostsData || []}
                        compact
                      />
                    </LazyWrapper>
                  </div>
                </div>

                <div className="bg-card border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground mb-4">
                    Fleet Utilization
                  </h3>
                  <div className="h-[250px] w-full">
                    <PerformanceMetricsChart
                      data={performanceMetrics}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Recent Activity
              </h3>
              <div>
                <LazyWrapper>
                  <LazyRecentActivity
                    activities={recentActivities}
                    isLoading={false}
                  />
                </LazyWrapper>
              </div>
            </div>

            <div className="bg-card border border-border p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  Add Driver
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  size="sm"
                >
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