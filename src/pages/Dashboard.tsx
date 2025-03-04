import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, BarChart, AlertTriangle, Calendar, Activity, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { CostsTab } from "@/components/dashboard/CostsTab";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { 
  initialStats, initialFinancialStats, initialAlerts, initialTrips, initialCostsBreakdown, initialRecentActivities
} from "@/data/dashboard/mock-data";
import { StatCardProps, TripItemProps, AlertItemProps, CostsBreakdownProps, ActivityItemProps } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [stats, setStats] = useState<StatCardProps[]>(initialStats);
  const [financialStats, setFinancialStats] = useState<StatCardProps[]>(initialFinancialStats);
  const [recentAlerts, setRecentAlerts] = useState<AlertItemProps[]>(initialAlerts);
  const [upcomingTrips, setUpcomingTrips] = useState<TripItemProps[]>(initialTrips);
  const [costsBreakdown, setCostsBreakdown] = useState<CostsBreakdownProps>(initialCostsBreakdown);
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(initialRecentActivities);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, (payload) => {
        console.log('Vehicles change received:', payload);
        toast({
          title: "Vehicle Update",
          description: `A vehicle has been ${payload.eventType.toLowerCase()}d.`,
        });
        fetchDashboardData();
      })
      .subscribe();

    const driversChannel = supabase
      .channel('drivers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'drivers' 
      }, (payload) => {
        console.log('Drivers change received:', payload);
        toast({
          title: "Driver Update",
          description: `A driver has been ${payload.eventType.toLowerCase()}d.`,
        });
        fetchDashboardData();
      })
      .subscribe();
      
    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance' 
      }, (payload) => {
        console.log('Maintenance change received:', payload);
        toast({
          title: "Maintenance Update",
          description: `A maintenance record has been ${payload.eventType.toLowerCase()}d.`,
        });
        fetchDashboardData();
      })
      .subscribe();
      
    const fuelLogsChannel = supabase
      .channel('fuel-logs-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'fuel_logs' 
      }, (payload) => {
        console.log('Fuel log change received:', payload);
        toast({
          title: "Fuel Log Update",
          description: `A fuel log has been ${payload.eventType.toLowerCase()}d.`,
        });
        fetchDashboardData();
      })
      .subscribe();

    const tripsChannel = supabase
      .channel('trips-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trips' 
      }, (payload) => {
        console.log('Trip change received:', payload);
        toast({
          title: "Trip Update",
          description: `A trip has been ${payload.eventType.toLowerCase()}d.`,
        });
        fetchDashboardData(true);
      })
      .subscribe();

    fetchDashboardData();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(fuelLogsChannel);
      supabase.removeChannel(tripsChannel);
    };
  }, [toast]);

  const fetchDashboardData = async (updateTrips = false) => {
    try {
      setIsLoading(true);
      console.log('Fetching dashboard data...');
      
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');
      
      if (vehiclesError) throw vehiclesError;
      
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*');
      
      if (driversError) throw driversError;
      
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('date', { ascending: false });
      
      if (tripsError) throw tripsError;
      
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('*');
      
      if (maintenanceError) throw maintenanceError;
      
      const { data: fuelLogsData, error: fuelLogsError } = await supabase
        .from('fuel_logs')
        .select('*');
      
      if (fuelLogsError) throw fuelLogsError;

      const activeVehicles = vehiclesData.filter(v => v.status === 'active').length;
      const activeDrivers = driversData.filter(d => d.status === 'active').length;
      const completedTrips = tripsData.filter(t => t.status === 'completed').length;
      const upcomingTripsCount = tripsData.filter(t => t.status === 'scheduled').length;
      
      const newStats: StatCardProps[] = [
        {
          name: "Total Vehicles",
          value: vehiclesData.length.toString(),
          icon: "Car",
          change: "+0%",
          changeType: "neutral" as const,
        },
        {
          name: "Active Drivers",
          value: activeDrivers.toString(),
          icon: "Users",
          change: "+0%",
          changeType: "neutral" as const,
        },
        {
          name: "Completed Trips",
          value: completedTrips.toString(),
          icon: "CheckCircle",
          change: "+0%",
          changeType: "neutral" as const,
        },
        {
          name: "Upcoming Trips",
          value: upcomingTripsCount.toString(),
          icon: "Calendar",
          change: "+0%",
          changeType: "neutral" as const,
        },
      ];
      
      setStats(newStats);
      
      const maintenanceCosts = maintenanceData.reduce((sum, item) => sum + Number(item.cost), 0);
      const fuelCosts = fuelLogsData.reduce((sum, item) => sum + Number(item.cost), 0);
      const totalCosts = maintenanceCosts + fuelCosts;
      
      const totalRevenue = tripsData
        .filter(t => t.status === 'completed')
        .reduce((sum, trip) => sum + Number(trip.amount), 0);
      
      const profit = totalRevenue - totalCosts;
      
      const newFinancialStats: StatCardProps[] = [
        {
          name: "Revenue (USD)",
          value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          icon: "DollarSign",
          change: "+0%",
          changeType: "neutral" as const,
        },
        {
          name: "Costs (USD)",
          value: `$${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          icon: "CreditCard",
          change: "+0%",
          changeType: "neutral" as const,
        },
        {
          name: "Profit (USD)",
          value: `$${profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          icon: "Wallet",
          change: "+0%",
          changeType: "neutral" as const,
        },
      ];
      
      setFinancialStats(newFinancialStats);
      
      const dieselCost = fuelLogsData
        .filter(log => log.fuel_type === 'diesel')
        .reduce((sum, log) => sum + Number(log.cost), 0);
      
      const petrolCost = fuelLogsData
        .filter(log => log.fuel_type === 'petrol')
        .reduce((sum, log) => sum + Number(log.cost), 0);
      
      const serviceCost = maintenanceData
        .filter(item => item.description.toLowerCase().includes('service'))
        .reduce((sum, item) => sum + Number(item.cost), 0);
      
      const repairsCost = maintenanceData
        .filter(item => !item.description.toLowerCase().includes('service'))
        .reduce((sum, item) => sum + Number(item.cost), 0);
      
      const updatedCostsBreakdown: CostsBreakdownProps = {
        maintenance: {
          service: serviceCost,
          repairs: repairsCost,
          total: serviceCost + repairsCost
        },
        fuel: {
          diesel: dieselCost,
          petrol: petrolCost,
          total: dieselCost + petrolCost
        }
      };
      
      setCostsBreakdown(updatedCostsBreakdown);
      
      if (updateTrips || upcomingTrips.length === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        
        const upcomingTripsData = tripsData
          .filter(trip => {
            const tripDate = new Date(trip.date);
            return tripDate >= today && tripDate <= next7Days && trip.status === 'scheduled';
          })
          .slice(0, 5);
        
        const formattedTrips: TripItemProps[] = await Promise.all(
          upcomingTripsData.map(async (trip) => {
            const { data: clientData } = await supabase
              .from('clients')
              .select('name')
              .eq('id', trip.client_id)
              .single();
            
            const { data: driverData } = await supabase
              .from('drivers')
              .select('name')
              .eq('id', trip.driver_id)
              .single();
            
            const tripDate = new Date(trip.date);
            const formattedDate = `${tripDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${trip.time ? trip.time.slice(0, 5) : 'TBD'}`;
            
            return {
              id: trip.id,
              client: clientData?.name || 'Unknown Client',
              destination: trip.dropoff_location || 'Unknown Destination',
              date: formattedDate,
              driver: driverData?.name || 'Unassigned'
            };
          })
        );
        
        setUpcomingTrips(formattedTrips);
      }
      
      const recentActivitiesData: ActivityItemProps[] = [];
      
      const recentTrips = tripsData.slice(0, 2);
      for (const trip of recentTrips) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', trip.client_id)
          .single();
        
        recentActivitiesData.push({
          id: Date.now() + Math.random(),
          title: `Trip ${trip.status} for ${clientData?.name || 'Unknown Client'}`,
          timestamp: new Date(trip.updated_at).toLocaleString(),
          type: "trip",
          icon: "Calendar"
        });
      }
      
      const recentMaintenance = maintenanceData.slice(0, 2);
      for (const maintenance of recentMaintenance) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('registration')
          .eq('id', maintenance.vehicle_id)
          .single();
        
        recentActivitiesData.push({
          id: Date.now() + Math.random(),
          title: `Maintenance ${maintenance.status} for ${vehicleData?.registration || 'Unknown Vehicle'}`,
          timestamp: new Date(maintenance.updated_at).toLocaleString(),
          type: "maintenance",
          icon: "Wrench"
        });
      }
      
      const recentFuelLogs = fuelLogsData.slice(0, 2);
      for (const log of recentFuelLogs) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('registration')
          .eq('id', log.vehicle_id)
          .single();
        
        recentActivitiesData.push({
          id: Date.now() + Math.random(),
          title: `Fuel log added for ${vehicleData?.registration || 'Unknown Vehicle'}`,
          timestamp: new Date(log.created_at).toLocaleString(),
          type: "fuel",
          icon: "Fuel"
        });
      }
      
      recentActivitiesData.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setRecentActivities(recentActivitiesData.slice(0, 6));
      
      const alertsData: AlertItemProps[] = [];
      
      const today = new Date();
      for (const maintenance of maintenanceData) {
        if (maintenance.next_scheduled) {
          const dueDate = new Date(maintenance.next_scheduled);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7 && diffDays > 0) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('registration')
              .eq('id', maintenance.vehicle_id)
              .single();
            
            alertsData.push({
              id: Date.now() + Math.random(),
              title: `Vehicle ${vehicleData?.registration || 'Unknown'} maintenance due in ${diffDays} days`,
              priority: diffDays <= 3 ? "high" : "medium",
              date: dueDate.toLocaleDateString()
            });
          }
        }
      }
      
      for (const driver of driversData) {
        if (driver.license_expiry) {
          const expiryDate = new Date(driver.license_expiry);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30 && diffDays > 0) {
            alertsData.push({
              id: Date.now() + Math.random(),
              title: `Driver ${driver.name}'s license expiring in ${diffDays} days`,
              priority: diffDays <= 7 ? "high" : diffDays <= 14 ? "medium" : "low",
              date: expiryDate.toLocaleDateString()
            });
          }
        }
      }
      
      if (fuelLogsData.length > 0) {
        const latestLog = fuelLogsData.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        if (latestLog.current_mileage && latestLog.previous_mileage && latestLog.volume) {
          const distance = latestLog.current_mileage - latestLog.previous_mileage;
          const efficiency = distance / latestLog.volume;
          
          if (efficiency < 10) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('registration')
              .eq('id', latestLog.vehicle_id)
              .single();
            
            alertsData.push({
              id: Date.now() + Math.random(),
              title: `Low fuel efficiency for ${vehicleData?.registration || 'Unknown Vehicle'}: ${efficiency.toFixed(2)} km/L`,
              priority: "low",
              date: new Date(latestLog.date).toLocaleDateString()
            });
          }
        }
      }
      
      alertsData.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setRecentAlerts(alertsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to update dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Fleet management overview and analytics
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={() => fetchDashboardData(true)}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <Tabs 
        defaultValue="overview" 
        className="space-y-6"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab 
            stats={stats} 
            financialStats={financialStats} 
            upcomingTrips={upcomingTrips}
            recentActivities={recentActivities}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsTab isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="costs">
          <CostsTab costsBreakdown={costsBreakdown} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsTab recentAlerts={recentAlerts} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
