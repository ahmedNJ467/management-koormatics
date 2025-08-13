import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Car,
  DollarSign,
  Target,
  Calendar,
  Users,
  Activity,
} from "lucide-react";

type Metric = {
  title: string;
  value: string;
  hint?: string;
  progress?: number;
  icon: React.ReactNode;
  trend?: string;
};

export function EnhancedOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["enhanced-overview-stats"],
    queryFn: async () => {
      const [
        { data: trips, error: tripsError },
        { data: vehicles, error: vehiclesError },
        { data: maintenance, error: maintenanceError },
      ] = await Promise.all([
        supabase
          .from("trips")
          .select("amount, status, date")
          .gte(
            "date",
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              .toISOString()
              .split("T")[0]
          ),
        supabase.from("vehicles").select("status"),
        supabase
          .from("maintenance")
          .select("cost, status")
          .gte(
            "date",
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              .toISOString()
              .split("T")[0]
          ),
      ]);

      if (tripsError || vehiclesError || maintenanceError) {
        throw new Error("Failed to fetch stats");
      }

      const monthlyRevenue =
        trips?.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0) || 0;
      const completedTrips =
        trips?.filter((t) => t.status === "completed").length || 0;
      const totalTrips = trips?.length || 0;
      const completionRate =
        totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
      const totalCosts =
        maintenance?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;
      const activeVehicles =
        vehicles?.filter((v) => v.status === "active").length || 0;
      const totalVehicles = vehicles?.length || 0;
      const utilizationRate =
        totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

      return {
        monthlyRevenue,
        completionRate,
        completedTrips,
        totalTrips,
        totalCosts,
        utilizationRate,
        activeVehicles,
        totalVehicles,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics: Metric[] = [
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue?.toLocaleString() || "0"}`,
      hint: `${stats?.completedTrips || 0} trips completed`,
      icon: <DollarSign className="h-5 w-5" />,
      trend: stats?.monthlyRevenue > 0 ? "+12.5%" : "0%",
    },
    {
      title: "Trip Completion",
      value: `${stats?.completionRate?.toFixed(1) || "0"}%`,
      hint: `${stats?.completedTrips || 0}/${stats?.totalTrips || 0} trips`,
      progress: stats?.completionRate || 0,
      icon: <Target className="h-5 w-5" />,
    },
    {
      title: "Total Costs",
      value: `$${stats?.totalCosts?.toLocaleString() || "0"}`,
      hint: "Monthly operational costs",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Fleet Utilization",
      value: `${stats?.utilizationRate?.toFixed(1) || "0"}%`,
      hint: `${stats?.activeVehicles || 0}/${stats?.totalVehicles || 0} active`,
      progress: stats?.utilizationRate || 0,
      icon: <Car className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          className="border shadow-sm hover:shadow-md transition-all duration-200 group bg-card"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-muted text-primary shadow-sm">
                {metric.icon}
              </div>
              {metric.trend && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-foreground">
                  {metric.trend}
                </span>
              )}
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {metric.title}
            </CardTitle>
            <div className="text-2xl font-bold text-foreground group-hover:scale-105 transition-transform duration-200">
              {metric.value}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metric.progress !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {metric.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={metric.progress}
                  className="h-2.5 bg-muted/50"
                />
              </div>
            )}
            {metric.hint && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/30 px-2 py-1.5 rounded-md">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{metric.hint}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
