import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Users, Car, Calendar, AlertTriangle, CheckCircle, Fuel, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function EnhancedOverview() {
  const { data: realtimeStats, isLoading, error } = useQuery({
    queryKey: ["realtime-dashboard-stats"],
    queryFn: async () => {
      // Fetch current month data
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Previous month for comparison
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      try {
        // Fetch trips data with better error handling
        const [currentTripsResult, prevTripsResult] = await Promise.all([
          supabase
            .from('trips')
            .select('amount, status')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]),
          
          supabase
            .from('trips')
            .select('amount, status')
            .gte('date', prevMonth.toISOString().split('T')[0])
            .lte('date', endOfPrevMonth.toISOString().split('T')[0])
        ]);

        if (currentTripsResult.error) {
          console.error('Error fetching current trips:', currentTripsResult.error);
        }
        if (prevTripsResult.error) {
          console.error('Error fetching previous trips:', prevTripsResult.error);
        }

        const currentTrips = currentTripsResult.data || [];
        const prevTrips = prevTripsResult.data || [];

        // Calculate revenue with null safety
        const currentRevenue = currentTrips.reduce((sum, trip) => {
          const amount = trip.amount ? Number(trip.amount) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const prevRevenue = prevTrips.reduce((sum, trip) => {
          const amount = trip.amount ? Number(trip.amount) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Calculate completion rate
        const completedTrips = currentTrips.filter(trip => trip.status === 'completed').length;
        const completionRate = currentTrips.length > 0 ? (completedTrips / currentTrips.length) * 100 : 0;

        // Fetch maintenance and fuel costs with error handling
        const [maintenanceResult, fuelResult] = await Promise.all([
          supabase
            .from('maintenance')
            .select('cost')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]),
          
          supabase
            .from('fuel_logs')
            .select('cost')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0])
        ]);

        if (maintenanceResult.error) {
          console.error('Error fetching maintenance costs:', maintenanceResult.error);
        }
        if (fuelResult.error) {
          console.error('Error fetching fuel costs:', fuelResult.error);
        }

        const maintenanceCosts = maintenanceResult.data?.reduce((sum, item) => {
          const cost = item.cost ? Number(item.cost) : 0;
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0) || 0;
        
        const fuelCosts = fuelResult.data?.reduce((sum, item) => {
          const cost = item.cost ? Number(item.cost) : 0;
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0) || 0;
        
        const totalCosts = maintenanceCosts + fuelCosts;
        const profit = currentRevenue - totalCosts;
        const profitMargin = currentRevenue > 0 ? (profit / currentRevenue) * 100 : 0;

        // Fleet utilization
        const { data: vehicles } = await supabase.from('vehicles').select('status');
        const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0;
        const totalVehicles = vehicles?.length || 0;
        const utilization = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

        return {
          revenue: {
            current: currentRevenue,
            growth: revenueGrowth,
            isPositive: revenueGrowth >= 0
          },
          trips: {
            total: currentTrips.length,
            completed: completedTrips,
            completionRate
          },
          profit: {
            amount: profit,
            margin: profitMargin,
            isPositive: profit >= 0
          },
          costs: {
            total: totalCosts,
            maintenance: maintenanceCosts,
            fuel: fuelCosts
          },
          fleet: {
            utilization,
            active: activeVehicles,
            total: totalVehicles
          }
        };
      } catch (err) {
        console.error('Error in dashboard stats query:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading dashboard data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!realtimeStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>No data available for this period.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${realtimeStats.revenue.current.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {realtimeStats.revenue.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={realtimeStats.revenue.isPositive ? "text-green-600" : "text-red-600"}>
                {Math.abs(realtimeStats.revenue.growth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trip Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeStats.trips.completionRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {realtimeStats.trips.completed} of {realtimeStats.trips.total} trips completed
            </div>
            <Progress value={realtimeStats.trips.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${realtimeStats.costs.total.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Monthly operational costs
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Car className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeStats.fleet.utilization.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {realtimeStats.fleet.active} of {realtimeStats.fleet.total} vehicles active
            </div>
            <Progress value={realtimeStats.fleet.utilization} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      {realtimeStats.costs.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Maintenance</span>
                  </div>
                  <span className="text-sm font-semibold">${realtimeStats.costs.maintenance.toLocaleString()}</span>
                </div>
                <Progress 
                  value={realtimeStats.costs.total > 0 ? (realtimeStats.costs.maintenance / realtimeStats.costs.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Fuel</span>
                  </div>
                  <span className="text-sm font-semibold">${realtimeStats.costs.fuel.toLocaleString()}</span>
                </div>
                <Progress 
                  value={realtimeStats.costs.total > 0 ? (realtimeStats.costs.fuel / realtimeStats.costs.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <Badge variant={realtimeStats.profit.isPositive ? "default" : "destructive"}>
                    {realtimeStats.profit.margin.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${realtimeStats.profit.amount.toLocaleString()} profit
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Costs</span>
                  <Badge variant="outline" className="font-semibold">
                    ${realtimeStats.costs.total.toLocaleString()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {realtimeStats.costs.maintenance > 0 && realtimeStats.costs.fuel > 0 ? 
                    `${((realtimeStats.costs.maintenance / realtimeStats.costs.total) * 100).toFixed(0)}% maintenance, ${((realtimeStats.costs.fuel / realtimeStats.costs.total) * 100).toFixed(0)}% fuel` :
                    'Cost breakdown'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
