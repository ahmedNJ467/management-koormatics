
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, Users, Wrench, FileText } from "lucide-react";

export function DashboardStats() {
  const { data: fleetStats, isLoading } = useQuery({
    queryKey: ["fleet-stats"],
    queryFn: async () => {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("status");

      if (vehiclesError) throw vehiclesError;

      const { data: drivers, error: driversError } = await supabase
        .from("drivers")
        .select("status");

      if (driversError) throw driversError;

      const { data: maintenance, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("status");

      if (maintenanceError) throw maintenanceError;

      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("status");

      if (contractsError) throw contractsError;

      return {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => v.status === "active").length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter((d) => d.status === "active").length,
        pendingMaintenance: maintenance.filter((m) => m.status === "scheduled").length,
        activeContracts: contracts.filter((c) => c.status === "active").length,
        totalContracts: contracts.length,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Vehicles",
      value: fleetStats?.totalVehicles || 0,
      description: `${fleetStats?.activeVehicles || 0} active`,
      icon: Car,
    },
    {
      title: "Total Drivers",
      value: fleetStats?.totalDrivers || 0,
      description: `${fleetStats?.activeDrivers || 0} active`,
      icon: Users,
    },
    {
      title: "Pending Maintenance",
      value: fleetStats?.pendingMaintenance || 0,
      description: "Scheduled tasks",
      icon: Wrench,
    },
    {
      title: "Active Contracts",
      value: fleetStats?.activeContracts || 0,
      description: `of ${fleetStats?.totalContracts || 0} total`,
      icon: FileText,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
