
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, CheckCircle, AlertTriangle, Car } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: string;
  progress?: number;
}

const MetricCard = ({ title, value, subtitle, trend, icon, color, progress }: MetricCardProps) => (
  <Card className={`relative overflow-hidden border-0 shadow-lg ${color}`}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs ${trend.isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <p className="text-xs text-white/70">{subtitle}</p>
      {progress !== undefined && (
        <div className="mt-3">
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>
      )}
    </CardContent>
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
  </Card>
);

export function EnhancedOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["enhanced-overview-stats"],
    queryFn: async () => {
      const [
        { data: trips, error: tripsError },
        { data: vehicles, error: vehiclesError },
        { data: maintenance, error: maintenanceError }
      ] = await Promise.all([
        supabase.from("trips").select("amount, status, date").gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from("vehicles").select("status"),
        supabase.from("maintenance").select("cost, status").gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ]);

      if (tripsError || vehiclesError || maintenanceError) {
        throw new Error("Failed to fetch stats");
      }

      const monthlyRevenue = trips?.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0) || 0;
      const completedTrips = trips?.filter(t => t.status === "completed").length || 0;
      const totalTrips = trips?.length || 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
      const totalCosts = maintenance?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;
      const activeVehicles = vehicles?.filter(v => v.status === "active").length || 0;
      const totalVehicles = vehicles?.length || 0;
      const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

      return {
        monthlyRevenue,
        completionRate,
        completedTrips,
        totalTrips,
        totalCosts,
        utilizationRate,
        activeVehicles,
        totalVehicles
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-gray-200" />
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue?.toLocaleString() || '0'}`,
      subtitle: `${stats?.completedTrips || 0} trips completed`,
      trend: { value: "12.5% from last month", isPositive: true },
      icon: <DollarSign className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Trip Completion",
      value: `${stats?.completionRate?.toFixed(1) || '0'}%`,
      subtitle: `${stats?.completedTrips || 0} of ${stats?.totalTrips || 0} trips completed`,
      icon: <CheckCircle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      progress: stats?.completionRate || 0,
    },
    {
      title: "Total Costs",
      value: `$${stats?.totalCosts?.toLocaleString() || '0'}`,
      subtitle: "Monthly operational costs",
      trend: { value: "8.2% from last month", isPositive: false },
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Fleet Utilization",
      value: `${stats?.utilizationRate?.toFixed(1) || '0'}%`,
      subtitle: `${stats?.activeVehicles || 0} of ${stats?.totalVehicles || 0} vehicles active`,
      icon: <Car className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      progress: stats?.utilizationRate || 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
