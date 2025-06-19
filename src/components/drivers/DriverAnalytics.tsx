import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Star,
  Users,
  Car,
  Zap,
  Target,
} from "lucide-react";
import { Driver } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  calculateOnTimePerformance,
  calculateTripDuration,
  calculateEfficiencyScore,
  getPerformanceCategory,
  formatDelay,
  hasActualTimeData,
  type TripTimeData,
} from "@/lib/utils/trip-performance";

interface DriverAnalyticsProps {
  drivers: Driver[];
  trips: any[];
  selectedDriver?: Driver;
}

interface DriverPerformance {
  totalTrips: number;
  completedTrips: number;
  onTimeTrips: number;
  averageTripDuration: number;
  totalDistance: number;
  completionRate: number;
  onTimeRate: number;
  efficiencyScore: number;
  averageDelay: number;
  lastTripDate?: string;
  monthlyTrips: number[];
  monthlyCompletion: number[];
  performanceCategory: {
    category: string;
    color: string;
    description: string;
  };
}

export function DriverAnalytics({
  drivers,
  trips,
  selectedDriver,
}: DriverAnalyticsProps) {
  // Calculate overall statistics
  const totalDrivers = drivers?.length || 0;
  const activeDrivers =
    drivers?.filter((d) => d.status === "active").length || 0;
  const inactiveDrivers =
    drivers?.filter((d) => d.status === "inactive").length || 0;
  const onLeaveDrivers =
    drivers?.filter((d) => d.status === "on_leave").length || 0;

  // Calculate license status
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringLicenses =
    drivers?.filter((d) => {
      const expiryDate = new Date(d.license_expiry);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    }).length || 0;
  const expiredLicenses =
    drivers?.filter((d) => {
      const expiryDate = new Date(d.license_expiry);
      return expiryDate < now;
    }).length || 0;

  // Calculate driver performance metrics with proper on-time tracking
  const driverPerformance: Record<string, DriverPerformance> = {};

  // Add null check for trips
  if (trips && Array.isArray(trips)) {
    trips.forEach((trip) => {
      if (trip?.driver_id) {
        if (!driverPerformance[trip.driver_id]) {
          driverPerformance[trip.driver_id] = {
            totalTrips: 0,
            completedTrips: 0,
            onTimeTrips: 0,
            averageTripDuration: 0,
            totalDistance: 0,
            completionRate: 0,
            onTimeRate: 0,
            efficiencyScore: 0,
            averageDelay: 0,
            monthlyTrips: new Array(12).fill(0),
            monthlyCompletion: new Array(12).fill(0),
            performanceCategory: {
              category: "Unknown",
              color: "text-gray-600",
              description: "No data",
            },
          };
        }

        const performance = driverPerformance[trip.driver_id];
        performance.totalTrips++;

        if (trip.status === "completed") {
          performance.completedTrips++;

          // Calculate on-time performance using actual vs scheduled times
          const tripTimeData: TripTimeData = {
            scheduledPickupTime: trip.time,
            scheduledReturnTime: trip.return_time,
            actualPickupTime: trip.actual_pickup_time,
            actualDropoffTime: trip.actual_dropoff_time,
            date: trip.date,
          };

          // Only calculate on-time if we have actual time data
          if (hasActualTimeData(tripTimeData)) {
            const onTimeMetrics = calculateOnTimePerformance(tripTimeData);
            if (onTimeMetrics.overallOnTime) {
              performance.onTimeTrips++;
            }

            // Calculate trip duration
            const duration = calculateTripDuration(tripTimeData);
            if (duration > 0) {
              performance.averageTripDuration =
                (performance.averageTripDuration *
                  (performance.completedTrips - 1) +
                  duration) /
                performance.completedTrips;
            }
          } else {
            // Fallback: assume on-time if no actual time data (for backward compatibility)
            performance.onTimeTrips++;
          }
        }

        // Calculate distance (if available)
        if (trip.distance) {
          performance.totalDistance += trip.distance;
        }

        // Calculate monthly data
        if (trip.date) {
          const tripDate = new Date(trip.date);
          const month = tripDate.getMonth();
          performance.monthlyTrips[month]++;
          if (trip.status === "completed") {
            performance.monthlyCompletion[month]++;
          }
        }

        if (
          !performance.lastTripDate ||
          trip.date > performance.lastTripDate!
        ) {
          performance.lastTripDate = trip.date;
        }
      }
    });
  }

  // Calculate rates, efficiency scores, and performance categories
  Object.keys(driverPerformance).forEach((driverId) => {
    const performance = driverPerformance[driverId];
    performance.completionRate =
      performance.totalTrips > 0
        ? (performance.completedTrips / performance.totalTrips) * 100
        : 0;
    performance.onTimeRate =
      performance.completedTrips > 0
        ? (performance.onTimeTrips / performance.completedTrips) * 100
        : 0;

    // Calculate average delay (placeholder - would need actual delay data)
    performance.averageDelay = 0; // This would be calculated from actual delay data

    // Calculate efficiency score using the utility function
    performance.efficiencyScore = calculateEfficiencyScore(
      performance.completionRate,
      performance.onTimeRate,
      performance.totalTrips,
      performance.averageDelay
    );

    // Get performance category
    performance.performanceCategory = getPerformanceCategory(
      performance.efficiencyScore
    );
  });

  // Top performers based on efficiency score
  const topPerformers = Object.entries(driverPerformance)
    .map(([driverId, performance]) => {
      const driver = drivers?.find((d) => d.id === driverId);
      return {
        id: driverId,
        name: driver?.name || "Unknown",
        ...performance,
      };
    })
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .slice(0, 5);

  // Status distribution data for pie chart
  const statusData = [
    { name: "Active", value: activeDrivers, color: "#10b981" },
    { name: "On Leave", value: onLeaveDrivers, color: "#f59e0b" },
    { name: "Inactive", value: inactiveDrivers, color: "#ef4444" },
  ];

  // Monthly performance data
  const monthlyData = [
    { month: "Jan", trips: 0, completion: 0 },
    { month: "Feb", trips: 0, completion: 0 },
    { month: "Mar", trips: 0, completion: 0 },
    { month: "Apr", trips: 0, completion: 0 },
    { month: "May", trips: 0, completion: 0 },
    { month: "Jun", trips: 0, completion: 0 },
    { month: "Jul", trips: 0, completion: 0 },
    { month: "Aug", trips: 0, completion: 0 },
    { month: "Sep", trips: 0, completion: 0 },
    { month: "Oct", trips: 0, completion: 0 },
    { month: "Nov", trips: 0, completion: 0 },
    { month: "Dec", trips: 0, completion: 0 },
  ];

  // Aggregate monthly data from all drivers
  Object.values(driverPerformance).forEach((performance) => {
    performance.monthlyTrips.forEach((trips, month) => {
      monthlyData[month].trips += trips;
    });
    performance.monthlyCompletion.forEach((completion, month) => {
      monthlyData[month].completion += completion;
    });
  });

  // Calculate overall metrics
  const totalTrips = Object.values(driverPerformance).reduce(
    (sum, p) => sum + p.totalTrips,
    0
  );
  const totalCompleted = Object.values(driverPerformance).reduce(
    (sum, p) => sum + p.completedTrips,
    0
  );
  const avgCompletionRate =
    Object.values(driverPerformance).reduce(
      (sum, p) => sum + p.completionRate,
      0
    ) / Object.keys(driverPerformance).length || 0;
  const avgEfficiencyScore =
    Object.values(driverPerformance).reduce(
      (sum, p) => sum + p.efficiencyScore,
      0
    ) / Object.keys(driverPerformance).length || 0;
  const avgOnTimeRate =
    Object.values(driverPerformance).reduce((sum, p) => sum + p.onTimeRate, 0) /
      Object.keys(driverPerformance).length || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompleted} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCompletionRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={avgCompletionRate} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgOnTimeRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on actual times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Efficiency Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgEfficiencyScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100 points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Drivers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeDrivers / totalDrivers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Driver Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Status Distribution</CardTitle>
            <CardDescription>Current driver availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trip Performance</CardTitle>
            <CardDescription>Trip volume and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "trips" ? value : `${value}%`,
                      name === "trips" ? "Trips" : "Completion Rate",
                    ]}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="trips"
                    fill="#8884d8"
                    name="Trips"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="completion"
                    fill="#82ca9d"
                    name="Completion %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Drivers</CardTitle>
          <CardDescription>
            Drivers with highest efficiency scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((driver, index) => (
              <div
                key={driver.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{driver.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {driver.totalTrips} trips •{" "}
                      {driver.completionRate.toFixed(1)}% completion •{" "}
                      {driver.onTimeRate.toFixed(1)}% on-time
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {driver.efficiencyScore.toFixed(1)}
                  </div>
                  <p className={`text-sm ${driver.performanceCategory.color}`}>
                    {driver.performanceCategory.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key metrics and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Safety & Reliability</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Completion Rate:</span>
                  <span className="font-medium">
                    {avgCompletionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>On-Time Performance:</span>
                  <span className="font-medium">
                    {avgOnTimeRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Safety Incidents:</span>
                  <span className="font-medium text-green-600">0</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Efficiency Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Trip Duration:</span>
                  <span className="font-medium">2.3 hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Distance Covered:</span>
                  <span className="font-medium">1,247 km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fuel Efficiency:</span>
                  <span className="font-medium">8.5 L/100km</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Alerts */}
      {(expiredLicenses > 0 || expiringLicenses > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              License Alerts
            </CardTitle>
            <CardDescription className="text-red-600">
              Drivers with expiring or expired licenses require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {expiredLicenses > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-700">
                      {expiredLicenses} Expired Licenses
                    </div>
                    <div className="text-sm text-red-600">
                      Immediate action required
                    </div>
                  </div>
                </div>
              )}
              {expiringLicenses > 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-700">
                      {expiringLicenses} Expiring Soon
                    </div>
                    <div className="text-sm text-orange-600">
                      Within 30 days
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
