import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Car,
  Users,
  DollarSign,
  Activity,
  Shield,
  MapPin,
  Calendar,
} from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";

interface OperationMetricsProps {
  trips: DisplayTrip[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

export function OperationMetrics({ trips, drivers, vehicles }: OperationMetricsProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.toDateString());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Today's metrics
    const todayTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });

    // This week's metrics
    const weekTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate >= startOfWeek && tripDate <= now;
    });

    // Status breakdown
    const scheduled = trips.filter(t => t.status === "scheduled").length;
    const inProgress = trips.filter(t => t.status === "in_progress").length;
    const completed = trips.filter(t => t.status === "completed").length;
    const cancelled = trips.filter(t => t.status === "cancelled").length;

    // Overdue trips
    const overdue = trips.filter(trip => {
      if (!trip.date || !trip.time || trip.status !== "scheduled") return false;
      const tripDateTime = new Date(`${trip.date}T${trip.time}`);
      return tripDateTime < now;
    }).length;

    // Resource availability
    const busyDrivers = trips.filter(t => 
      t.driver_id && t.status === "in_progress"
    ).length;
    const availableDrivers = drivers.length - busyDrivers;

    const busyVehicles = trips.filter(t => 
      t.vehicle_id && t.status === "in_progress"
    ).length;
    const availableVehicles = vehicles.length - busyVehicles;

    // High priority trips (security escort)
    const securityEscorts = trips.filter(t => t.has_security_escort).length;

    // Revenue metrics
    const todayRevenue = todayTrips.reduce((sum, trip) => sum + (trip.amount || 0), 0);
    const weekRevenue = weekTrips.reduce((sum, trip) => sum + (trip.amount || 0), 0);

    // Efficiency metrics
    const onTimeTrips = completed; // Simplified for now
    const completionRate = (scheduled + inProgress + completed) > 0 
      ? Math.round((completed / (scheduled + inProgress + completed)) * 100)
      : 0;

    return {
      today: {
        trips: todayTrips.length,
        revenue: todayRevenue,
        completed: todayTrips.filter(t => t.status === "completed").length,
      },
      week: {
        trips: weekTrips.length,
        revenue: weekRevenue,
      },
      status: { scheduled, inProgress, completed, cancelled, overdue },
      resources: { 
        availableDrivers, 
        totalDrivers: drivers.length,
        availableVehicles, 
        totalVehicles: vehicles.length 
      },
      security: { securityEscorts },
      efficiency: { onTimeTrips, completionRate },
    };
  }, [trips, drivers, vehicles]);

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    className = "",
    children 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    className?: string;
    children?: React.ReactNode;
  }) => (
    <Card className={`${className} bg-gradient-to-br from-card to-card/80 border-0 shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
        {subtitle && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
            {subtitle}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      {/* Today's Operations */}
      <MetricCard
        title="Today's Trips"
        value={metrics.today.trips}
        subtitle={`${metrics.today.completed} completed`}
        icon={Calendar}
        trend="up"
        className="md:col-span-1"
      />

      {/* Active Operations */}
      <MetricCard
        title="Active Trips"
        value={metrics.status.inProgress}
        subtitle={`${metrics.status.scheduled} scheduled`}
        icon={Activity}
        className="md:col-span-1"
      >
        {metrics.status.overdue > 0 && (
          <Badge variant="destructive" className="mt-2 text-xs">
            {metrics.status.overdue} overdue
          </Badge>
        )}
      </MetricCard>

      {/* Driver Availability */}
      <MetricCard
        title="Driver Status"
        value={`${metrics.resources.availableDrivers}/${metrics.resources.totalDrivers}`}
        subtitle="Available drivers"
        icon={Users}
        className="md:col-span-1"
      >
        <Progress 
          value={(metrics.resources.availableDrivers / metrics.resources.totalDrivers) * 100} 
          className="mt-2"
        />
      </MetricCard>

      {/* Vehicle Availability */}
      <MetricCard
        title="Fleet Status"
        value={`${metrics.resources.availableVehicles}/${metrics.resources.totalVehicles}`}
        subtitle="Available vehicles"
        icon={Car}
        className="md:col-span-1"
      >
        <Progress 
          value={(metrics.resources.availableVehicles / metrics.resources.totalVehicles) * 100} 
          className="mt-2"
        />
      </MetricCard>

      {/* Security Escorts */}
      <MetricCard
        title="Security Escorts"
        value={metrics.security.securityEscorts}
        subtitle="Active escorts"
        icon={Shield}
        className="md:col-span-1"
      />

      {/* Revenue */}
      <MetricCard
        title="Today's Revenue"
        value={`$${metrics.today.revenue.toLocaleString()}`}
        subtitle={`Week: $${metrics.week.revenue.toLocaleString()}`}
        icon={DollarSign}
        trend="up"
        className="md:col-span-1"
      />

      {/* Alerts Section */}
      {(metrics.status.overdue > 0 || metrics.resources.availableDrivers === 0 || metrics.resources.availableVehicles === 0) && (
        <Card className="md:col-span-2 lg:col-span-4 xl:col-span-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Operation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.status.overdue > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {metrics.status.overdue} overdue trip{metrics.status.overdue > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {metrics.resources.availableDrivers === 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700 dark:text-orange-400">
                    No available drivers
                  </span>
                </div>
              )}
              {metrics.resources.availableVehicles === 0 && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700 dark:text-orange-400">
                    No available vehicles
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}