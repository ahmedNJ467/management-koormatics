import { useState, useEffect, useMemo } from "react";
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
import type { LucideIcon } from "lucide-react";
import {
  Car,
  Users,
  Wrench,
  Fuel,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Shield,
  AlertTriangle,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-helpers";
import { isDateInMonth } from "@/utils/date-utils";

type SummaryCardConfig = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
};

type SummarySection = {
  title?: string;
  cards: SummaryCardConfig[];
};

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

const FinancialOverviewChart = dynamic(
  () =>
    import("@/components/dashboard/charts/FinancialOverviewChart").then(
      (m) => m.FinancialOverviewChart
    ),
  { ssr: false }
);

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

export default function Dashboard() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  const { domain, isAllowed, loading: tenantLoading } = useTenantScope();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(
    []
  );

  const isManagementDashboard = domain === "management";
  const isFleetDashboard = domain === "fleet";
  const isOperationsDashboard = domain === "operations";
  const isFinanceDashboard = domain === "finance";

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
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
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
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: fuelLogs = [], isLoading: fuelLogsLoading } = useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fuel_logs").select("*");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Financial Department
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    enabled: isManagementDashboard || isFinanceDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, total_amount, paid_amount, created_at, date");
      if (error) {
        console.error("Dashboard invoices fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: quotations = [], isLoading: quotationsLoading } = useQuery({
    queryKey: ["quotations"],
    enabled: isManagementDashboard || isFinanceDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("id, status, total_amount, created_at");
      if (error) {
        console.error("Dashboard quotations fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Operations Department
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    enabled: !isFinanceDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, status");
      if (error) {
        console.error("Dashboard trips fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Clients Department
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    enabled: isManagementDashboard || isFinanceDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id");
      if (error) {
        console.error("Dashboard clients fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Security Department
  const { data: securityGuards = [], isLoading: guardsLoading } = useQuery({
    queryKey: ["security_guards"],
    enabled: isManagementDashboard || isOperationsDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_guards")
        .select("id, status");
      if (error) {
        console.error("Dashboard security guards fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: incidentReports = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ["vehicle-incident-reports"],
    enabled: isManagementDashboard || isOperationsDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_incident_reports")
        .select("id, status, severity");
      if (error) {
        console.error("Dashboard incident reports fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Leasing Department
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ["vehicle-leases"],
    enabled: isManagementDashboard || isFleetDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_leases")
        .select("id");
      if (error) {
        console.error("Dashboard vehicle leases fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Inventory Department
  const { data: spareParts = [], isLoading: sparePartsLoading } = useQuery({
    queryKey: ["spare-parts"],
    enabled: isManagementDashboard || isFleetDashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("id, quantity, min_stock_level");
      if (error) {
        console.error("Dashboard spare parts fetch error:", {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const loading =
    vehiclesLoading ||
    driversLoading ||
    fuelLogsLoading ||
    maintenanceLoading ||
    invoicesLoading ||
    quotationsLoading ||
    tripsLoading ||
    clientsLoading ||
    guardsLoading ||
    incidentsLoading ||
    leasesLoading ||
    sparePartsLoading;

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
          queryClient.invalidateQueries({ queryKey: ["trips"] });

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

      // Financial Department subscriptions
      unsubscribes.push(
        realtimeManager.subscribeToTable("invoices", async () => {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("quotations", async () => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
        })
      );

      // Clients Department subscriptions
      unsubscribes.push(
        realtimeManager.subscribeToTable("clients", async () => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        })
      );

      // Security Department subscriptions
      unsubscribes.push(
        realtimeManager.subscribeToTable("security_guards", async () => {
          queryClient.invalidateQueries({ queryKey: ["security_guards"] });
        })
      );

      unsubscribes.push(
        realtimeManager.subscribeToTable("vehicle_incident_reports", async () => {
          queryClient.invalidateQueries({ queryKey: ["vehicle-incident-reports"] });
        })
      );

      // Leasing Department subscriptions
      unsubscribes.push(
        realtimeManager.subscribeToTable("vehicle_leases", async () => {
          queryClient.invalidateQueries({ queryKey: ["vehicle-leases"] });
        })
      );

      // Inventory Department subscriptions
      unsubscribes.push(
        realtimeManager.subscribeToTable("spare_parts", async () => {
          queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
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

  const lastSixMonths = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return date.toLocaleString("default", { month: "short" });
    });
  }, []);

  const maintenanceCostByMonth = useMemo(() => {
    const map = new Map<string, number>();
    (chartData?.maintenanceCostsData || []).forEach((item: any) => {
      if (item?.month) {
        map.set(item.month, Number(item.cost) || 0);
      }
    });
    return map;
  }, [chartData?.maintenanceCostsData]);

  const financialOverviewData = useMemo(() => {
    return lastSixMonths.map((month) => {
      const monthInvoices = invoices.filter((invoice: any) => {
        const invoiceDate = invoice?.date || invoice?.created_at;
        return isDateInMonth(invoiceDate, month);
      });

      const revenue = monthInvoices.reduce((sum: number, invoice: any) => {
        const paidAmount = Number(invoice?.paid_amount) || 0;
        const totalAmount = Number(invoice?.total_amount) || 0;
        return sum + (paidAmount > 0 ? paidAmount : totalAmount);
      }, 0);

      const costs = maintenanceCostByMonth.get(month) || 0;
      const profit = revenue - costs;

      return {
        month,
        revenue: Math.max(0, Math.round(revenue)),
        costs: Math.max(0, Math.round(costs)),
        profit: Math.max(0, Math.round(profit)),
      };
    });
  }, [invoices, lastSixMonths, maintenanceCostByMonth]);

  const driverStatusChartData = useMemo(() => {
    return (chartData?.driverStatusData || []).map((item: any) => ({
      status: item?.name || "Unknown",
      count: item?.value || 0,
    }));
  }, [chartData?.driverStatusData]);

  // Calculate key metrics - Fleet Management
  const totalVehicles = vehicles?.length || 0;
  const activeDrivers =
    drivers?.filter((d) => d.status === "active")?.length || 0;
  const totalDrivers = drivers?.length || 0;
  const pendingMaintenance =
    maintenance?.filter((m) => m.status === "scheduled")?.length || 0;
  const totalFuelLogs = fuelLogs?.length || 0;

  // Financial Department
  const totalInvoices = invoices?.length || 0;
  const outstandingInvoices =
    invoices?.filter((i) => i.status === "sent" || i.status === "overdue")
      ?.length || 0;
  const totalQuotations = quotations?.length || 0;
  const pendingQuotations =
    quotations?.filter((q) => q.status === "draft" || q.status === "sent")
      ?.length || 0;

  // Operations Department
  const totalTrips = trips?.length || 0;
  const completedTrips = trips?.filter((t) => t.status === "completed")?.length || 0;
  const scheduledTrips = trips?.filter((t) => t.status === "scheduled")?.length || 0;
  const inProgressTrips =
    trips?.filter((t) => t.status === "in_progress")?.length || 0;
  const cancelledTrips = trips?.filter((t) => t.status === "cancelled")?.length || 0;

  // Clients Department
  const totalClients = clients?.length || 0;

  // Security Department
  const activeGuards =
    securityGuards?.filter((g) => g.status === "active")?.length || 0;
  const totalGuards = securityGuards?.length || 0;
  const criticalIncidents =
    incidentReports?.filter((i) => i.severity === "critical")?.length || 0;

  // Leasing Department
  const activeLeases =
    leases?.filter((l: any) => l?.lease_status === "active")?.length || 0;
  const totalLeases = leases?.length || 0;

  // Inventory Department
  const lowStockParts =
    spareParts?.filter(
      (p) => p.quantity <= (p.min_stock_level || 0)
    )?.length || 0;
  const totalParts = spareParts?.length || 0;

  // Finance metrics
  const paidInvoices = invoices?.filter((i) => i.status === "paid")?.length || 0;
  const overdueInvoicesCount =
    invoices?.filter((i) => i.status === "overdue")?.length || 0;
  const overdueInvoiceAmount = invoices?.reduce(
    (sum: number, invoice: any) =>
      invoice?.status === "overdue"
        ? sum +
          Math.max(
            0,
            Number(invoice?.total_amount || 0) -
              Number(invoice?.paid_amount || 0)
          )
        : sum,
    0
  ) || 0;
  const totalInvoicedAmount = invoices?.reduce(
    (sum: number, invoice: any) => sum + Number(invoice?.total_amount || 0),
    0
  ) || 0;
  const totalPaidAmount = invoices?.reduce(
    (sum: number, invoice: any) => sum + Number(invoice?.paid_amount || 0),
    0
  ) || 0;
  const outstandingInvoiceAmount = invoices?.reduce(
    (sum: number, invoice: any) =>
      sum +
      Math.max(
        0,
        Number(invoice?.total_amount || 0) - Number(invoice?.paid_amount || 0)
      ),
    0
  ) || 0;

  const approvedQuotations =
    quotations?.filter((q) => q.status === "approved")?.length || 0;
  const rejectedQuotations =
    quotations?.filter((q) => q.status === "rejected")?.length || 0;

  const totalMaintenanceExpense = maintenance?.reduce(
    (sum, record: any) => sum + Number(record?.expense || 0),
    0
  ) || 0;

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

  const totalIncidents = incidentReports?.length || 0;

  const SummaryCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: SummaryCardConfig) => {
    const formattedValue =
      typeof value === "number" ? value.toLocaleString() : value;
    const subtitleText =
      typeof subtitle === "string" && subtitle.trim().length > 0
        ? subtitle
        : "\u00A0";

    return (
      <div className="bg-card border border-border rounded-lg p-4 h-full min-h-[130px] flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold text-foreground mt-2">
              {formattedValue}
          </p>
        </div>
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{subtitleText}</p>
      </div>
    );
  };

  const summarySections = useMemo<SummarySection[]>(
    () => {
      if (isManagementDashboard) {
        return [
          {
            title: "Fleet Management",
            cards: [
              {
                title: "Vehicles",
                value: totalVehicles,
                subtitle: `${fleetUtilization}% utilization`,
                icon: Car,
              },
              {
                title: "Drivers",
                value: totalDrivers,
                subtitle: `${activeDrivers} active`,
                icon: Users,
              },
              {
                title: "Maintenance",
                value: pendingMaintenance,
                subtitle: "Scheduled tasks",
                icon: Wrench,
              },
              {
                title: "Fuel Logs",
                value: totalFuelLogs,
                subtitle: "Entries logged",
                icon: Fuel,
              },
            ],
          },
          {
            title: "Financial & Operations",
            cards: [
              {
                title: "Invoices",
                value: totalInvoices,
                subtitle: `${outstandingInvoices} outstanding`,
                icon: FileText,
              },
              {
                title: "Quotations",
                value: totalQuotations,
                subtitle: `${pendingQuotations} pending`,
                icon: DollarSign,
              },
              {
                title: "Trips",
                value: totalTrips,
                subtitle: `${completedTrips} completed`,
                icon: Calendar,
              },
              {
                title: "Clients",
                value: totalClients,
                subtitle: "Active engagements",
                icon: Building2,
              },
            ],
          },
          {
            title: "Security, Leasing & Inventory",
            cards: [
              {
                title: "Security Guards",
                value: totalGuards,
                subtitle: `${activeGuards} active`,
                icon: Shield,
              },
              {
                title: "Incidents",
                value: totalIncidents,
                subtitle: `${criticalIncidents} critical`,
                icon: AlertTriangle,
              },
              {
                title: "Leasing",
                value: activeLeases,
                subtitle: `${totalLeases} total`,
                icon: TrendingUp,
              },
              {
                title: "Spare Parts",
                value: totalParts,
                subtitle: `${lowStockParts} low stock`,
                icon: Package,
              },
            ],
          },
        ];
      }

      if (isFleetDashboard) {
        return [
          {
            cards: [
              {
                title: "Vehicles",
                value: totalVehicles,
                subtitle: `${fleetUtilization}% utilization`,
                icon: Car,
              },
              {
                title: "Active Drivers",
                value: activeDrivers,
                subtitle: `${totalDrivers} total`,
                icon: Users,
              },
              {
                title: "Maintenance Tasks",
                value: pendingMaintenance,
                subtitle: "Scheduled",
                icon: Wrench,
              },
              {
                title: "Fuel Logs",
                value: totalFuelLogs,
                subtitle: "Entries logged",
                icon: Fuel,
              },
              {
                title: "Trips",
                value: totalTrips,
                subtitle: `${completedTrips} completed`,
                icon: Calendar,
              },
              {
                title: "Incidents",
                value: totalIncidents,
                subtitle: `${criticalIncidents} critical`,
                icon: AlertTriangle,
              },
              {
                title: "In Progress",
                value: inProgressTrips,
                subtitle: `${scheduledTrips} scheduled`,
                icon: TrendingUp,
              },
              {
                title: "Spare Parts",
                value: totalParts,
                subtitle: `${lowStockParts} low stock`,
                icon: Package,
              },
            ],
          },
        ];
      }

      if (isOperationsDashboard) {
        return [
          {
            cards: [
              {
                title: "Total Trips",
                value: totalTrips,
                subtitle: `${completedTrips} completed`,
                icon: Calendar,
              },
              {
                title: "In Progress",
                value: inProgressTrips,
                subtitle: `${scheduledTrips} scheduled`,
                icon: TrendingUp,
              },
              {
                title: "Cancelled",
                value: cancelledTrips,
                subtitle: "Cancellations",
                icon: XCircle,
              },
              {
                title: "Active Drivers",
                value: activeDrivers,
                subtitle: `${totalDrivers} total`,
                icon: Users,
              },
              {
                title: "Maintenance Tasks",
                value: pendingMaintenance,
                subtitle: "Scheduled",
                icon: Wrench,
              },
              {
                title: "Fuel Logs",
                value: totalFuelLogs,
                subtitle: "Entries logged",
                icon: Fuel,
              },
              {
                title: "Incidents",
                value: totalIncidents,
                subtitle: `${criticalIncidents} critical`,
                icon: AlertTriangle,
              },
              {
                title: "Security Guards",
                value: totalGuards,
                subtitle: `${activeGuards} active`,
                icon: Shield,
              },
            ],
          },
        ];
      }

      if (isFinanceDashboard) {
        return [
          {
            title: "Revenue & Collections",
            cards: [
              {
                title: "Total Invoiced",
                value: formatCurrency(totalInvoicedAmount),
                subtitle: `${totalInvoices} invoices`,
                icon: DollarSign,
              },
              {
                title: "Collected",
                value: formatCurrency(totalPaidAmount),
                subtitle: `${paidInvoices} paid`,
                icon: TrendingUp,
              },
              {
                title: "Outstanding",
                value: formatCurrency(outstandingInvoiceAmount),
                subtitle: `${outstandingInvoices} outstanding`,
                icon: FileText,
              },
              {
                title: "Overdue",
                value: formatCurrency(overdueInvoiceAmount),
                subtitle: `${overdueInvoicesCount} invoices`,
                icon: AlertTriangle,
              },
            ],
          },
          {
            title: "Sales Pipeline",
            cards: [
              {
                title: "Quotations",
                value: totalQuotations,
                subtitle: `${pendingQuotations} pending`,
                icon: Package,
              },
              {
                title: "Approved Quotes",
                value: approvedQuotations,
                subtitle: `${rejectedQuotations} rejected`,
                icon: CheckCircle,
              },
              {
                title: "Maintenance Spend",
                value: formatCurrency(totalMaintenanceExpense),
                subtitle: "Tracked costs",
                icon: Wrench,
              },
              {
                title: "Fuel Logs",
                value: totalFuelLogs,
                subtitle: "Entries logged",
                icon: Fuel,
              },
            ],
          },
        ];
      }

      return [];
    },
    [
      isManagementDashboard,
      isFleetDashboard,
      isOperationsDashboard,
      isFinanceDashboard,
      totalVehicles,
      fleetUtilization,
      totalDrivers,
      activeDrivers,
      pendingMaintenance,
      totalFuelLogs,
      totalInvoices,
      outstandingInvoices,
      totalQuotations,
      pendingQuotations,
      totalTrips,
      completedTrips,
      inProgressTrips,
      scheduledTrips,
      cancelledTrips,
      totalClients,
      totalGuards,
      activeGuards,
      totalIncidents,
      criticalIncidents,
      activeLeases,
      totalLeases,
      totalParts,
      lowStockParts,
      paidInvoices,
      totalInvoicedAmount,
      totalPaidAmount,
      outstandingInvoiceAmount,
      overdueInvoiceAmount,
      overdueInvoicesCount,
      approvedQuotations,
      rejectedQuotations,
      totalMaintenanceExpense,
    ]
  );

  const renderManagementCharts = () => (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Fuel Consumption
          </h3>
          <div className="h-[280px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[280px]" />}>
              <FuelConsumptionChart
                data={chartData?.fuelConsumptionData || []}
                compact
              />
            </LazyWrapper>
          </div>
        </div>

          <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Financial Overview
          </h3>
          <div className="h-[280px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[280px]" />}>
              <FinancialOverviewChart data={financialOverviewData} />
            </LazyWrapper>
              </div>
            </div>
          </div>

      <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Maintenance Costs
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
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
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <PerformanceMetricsChart data={performanceMetrics} compact />
            </LazyWrapper>
              </div>
            </div>
          </div>

      <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Fleet Distribution
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <FleetDistributionChart
                data={chartData?.fleetDistributionData || []}
                compact
              />
            </LazyWrapper>
              </div>
            </div>

        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Driver Status
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <DriverStatusChart data={driverStatusChartData} compact />
            </LazyWrapper>
          </div>
        </div>
      </div>
    </>
  );

  const renderFleetOrOperationsCharts = () => (
    <>
              <div className="bg-card border border-border p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Fuel Consumption
                </h3>
        <div className="h-[320px] w-full">
          <LazyWrapper fallback={<ChartSkeleton height="h-[320px]" />}>
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
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
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
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <PerformanceMetricsChart data={performanceMetrics} compact />
            </LazyWrapper>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Fleet Distribution
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <FleetDistributionChart
                data={chartData?.fleetDistributionData || []}
                      compact
                    />
            </LazyWrapper>
                  </div>
                </div>

        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Driver Status
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <DriverStatusChart data={driverStatusChartData} compact />
            </LazyWrapper>
              </div>
            </div>
      </div>
    </>
  );

  const renderFinanceCharts = () => (
    <>
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Financial Overview
        </h3>
        <div className="h-[320px] w-full">
          <LazyWrapper fallback={<ChartSkeleton height="h-[320px]" />}>
            <FinancialOverviewChart data={financialOverviewData} />
          </LazyWrapper>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Maintenance Costs
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <MaintenanceCostsChart
                data={chartData?.maintenanceCostsData || []}
                compact
              />
            </LazyWrapper>
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Fuel Consumption
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <FuelConsumptionChart
                data={chartData?.fuelConsumptionData || []}
                compact
              />
            </LazyWrapper>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Fleet Utilization
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <PerformanceMetricsChart data={performanceMetrics} compact />
            </LazyWrapper>
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Driver Status
          </h3>
          <div className="h-[250px] w-full">
            <LazyWrapper fallback={<ChartSkeleton height="h-[250px]" />}>
              <DriverStatusChart data={driverStatusChartData} compact />
            </LazyWrapper>
          </div>
        </div>
      </div>
    </>
  );

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

        {/* Summary Sections */}
        <div className="space-y-6">
          {summarySections.map((section, index) => (
            <div key={section.title ?? `section-${index}`}>
              {section.title ? (
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {section.title}
                </h2>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {section.cards.map((card) => (
                  <SummaryCard
                    key={`${section.title ?? index}-${card.title}`}
                    {...card}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <section className="space-y-6">
            {isManagementDashboard && renderManagementCharts()}
            {isFleetDashboard && renderFleetOrOperationsCharts()}
            {isOperationsDashboard && renderFleetOrOperationsCharts()}
            {isFinanceDashboard && renderFinanceCharts()}
          </section>

          {!isFleetDashboard && (
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
          )}
        </div>
      </div>
    </div>
  );
}
