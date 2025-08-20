import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";

interface OperationMetricsProps {
  trips: DisplayTrip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  variant?: "grid" | "strip";
}

export function OperationMetrics({
  trips,
  drivers,
  vehicles,
  variant = "grid",
}: OperationMetricsProps) {
  const teamsQuery = useQuery({
    queryKey: ["escort_teams_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("escort_teams")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60_000,
  });
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.toDateString());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const todayTrips = trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });

    const weekTrips = trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      return tripDate >= startOfWeek && tripDate <= now;
    });

    const scheduled = trips.filter((t) => t.status === "scheduled").length;
    const inProgress = trips.filter((t) => t.status === "in_progress").length;
    const completed = trips.filter((t) => t.status === "completed").length;
    const cancelled = trips.filter((t) => t.status === "cancelled").length;

    const overdue = trips.filter((trip) => {
      if (!trip.date || !trip.time || trip.status !== "scheduled") return false;
      const tripDateTime = new Date(`${trip.date}T${trip.time}`);
      return tripDateTime < now;
    }).length;

    const busyDrivers = trips.filter(
      (t) => t.driver_id && t.status === "in_progress"
    ).length;
    const availableDrivers = drivers.length - busyDrivers;

    const busyVehicles = trips.filter(
      (t) => t.vehicle_id && t.status === "in_progress"
    ).length;
    const availableVehicles = vehicles.length - busyVehicles;

    const securityEscorts = teamsQuery.data ?? 0;

    const todayRevenue = todayTrips.reduce(
      (sum, trip) => sum + (trip.amount || 0),
      0
    );
    const weekRevenue = weekTrips.reduce(
      (sum, trip) => sum + (trip.amount || 0),
      0
    );

    const completionRate =
      scheduled + inProgress + completed > 0
        ? Math.round((completed / (scheduled + inProgress + completed)) * 100)
        : 0;

    return {
      today: {
        trips: todayTrips.length,
        revenue: todayRevenue,
        completed: todayTrips.filter((t) => t.status === "completed").length,
      },
      week: { trips: weekTrips.length, revenue: weekRevenue },
      status: { scheduled, inProgress, completed, cancelled, overdue },
      resources: {
        availableDrivers,
        totalDrivers: drivers.length,
        availableVehicles,
        totalVehicles: vehicles.length,
      },
      security: { securityEscorts },
      efficiency: { completionRate },
    };
  }, [trips, drivers, vehicles, teamsQuery.data]);

  const Box = ({
    title,
    value,
    subtitle,
    children,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    children?: React.ReactNode;
  }) => (
    <div className="p-2">
      <div className="text-[11px] text-muted-foreground">{title}</div>
      <div className="text-xl font-semibold tabular-nums leading-tight">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );

  if (variant === "strip") {
    return (
      <div className="flex items-stretch gap-4 overflow-x-auto overflow-y-hidden px-1 py-1">
        <Box
          title="Today's Trips"
          value={metrics.today.trips}
          subtitle={`${metrics.today.completed} completed`}
        />
        <Box
          title="Active Trips"
          value={metrics.status.inProgress}
          subtitle={`${metrics.status.scheduled} scheduled`}
        />
        <Box
          title="Driver Availability"
          value={`${metrics.resources.availableDrivers}/${metrics.resources.totalDrivers}`}
        />
        <Box
          title="Fleet Availability"
          value={`${metrics.resources.availableVehicles}/${metrics.resources.totalVehicles}`}
        />
        <Box
          title="Security Escorts"
          value={metrics.security.securityEscorts}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 mb-2">
      <Box
        title="Today's Trips"
        value={metrics.today.trips}
        subtitle={`${metrics.today.completed} completed`}
      />
      <Box
        title="Active Trips"
        value={metrics.status.inProgress}
        subtitle={`${metrics.status.scheduled} scheduled`}
      />
      <Box
        title="Driver Availability"
        value={`${metrics.resources.availableDrivers}/${metrics.resources.totalDrivers}`}
      />
      <Box
        title="Fleet Availability"
        value={`${metrics.resources.availableVehicles}/${metrics.resources.totalVehicles}`}
      />
      <Box title="Security Escorts" value={metrics.security.securityEscorts} />

      {(metrics.status.overdue > 0 ||
        metrics.resources.availableDrivers === 0 ||
        metrics.resources.availableVehicles === 0) && (
        <div className="md:col-span-2 lg:col-span-6 px-2">
          <div className="text-xs font-medium mb-1">Operational Alerts</div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {metrics.status.overdue > 0 && (
              <Badge variant="destructive" className="text-xs">
                {metrics.status.overdue} overdue
              </Badge>
            )}
            {metrics.resources.availableDrivers === 0 && (
              <Badge variant="outline" className="text-xs">
                No available drivers
              </Badge>
            )}
            {metrics.resources.availableVehicles === 0 && (
              <Badge variant="outline" className="text-xs">
                No available vehicles
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
