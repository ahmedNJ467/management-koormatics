import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, BarChart, AlertTriangle, Calendar, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { CostsTab } from "@/components/dashboard/CostsTab";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { 
  initialStats, initialFinancialStats, initialAlerts, initialTrips, initialCostsBreakdown, initialRecentActivities
} from "@/data/dashboard/mock-data";
import { StatCardProps, TripItemProps, AlertItemProps, CostsBreakdownProps, ActivityItemProps } from "@/types/dashboard";
import { toast } from "sonner";

export default function Dashboard() {
  const [stats, setStats] = useState<StatCardProps[]>(initialStats);
  const [financialStats, setFinancialStats] = useState<StatCardProps[]>(initialFinancialStats);
  const [recentAlerts, setRecentAlerts] = useState<AlertItemProps[]>(initialAlerts);
  const [upcomingTrips, setUpcomingTrips] = useState<TripItemProps[]>(initialTrips);
  const [costsBreakdown, setCostsBreakdown] = useState<CostsBreakdownProps>(initialCostsBreakdown);
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(initialRecentActivities);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const setupRealtime = async () => {
      setIsLoading(true);
      
      const vehiclesChannel = supabase
        .channel('vehicles-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'vehicles' 
        }, (payload) => {
          console.log('Vehicles change received:', payload);
          fetchDashboardData();
          toast.info("Vehicle data updated");
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
          fetchDashboardData();
          toast.info("Driver data updated");
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
          fetchDashboardData();
          toast.info("Maintenance data updated");
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
          fetchDashboardData();
          toast.info("Fuel log updated");
        })
        .subscribe();

      await fetchDashboardData();
      setIsLoading(false);

      return () => {
        supabase.removeChannel(vehiclesChannel);
        supabase.removeChannel(driversChannel);
        supabase.removeChannel(maintenanceChannel);
        supabase.removeChannel(fuelLogsChannel);
      };
    };
    
    setupRealtime();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Simulate loading time for a more realistic preview
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStats = [...stats];
      const randomStatIndex = Math.floor(Math.random() * newStats.length);
      
      if (randomStatIndex === 0) {
        const newValue = parseInt(newStats[randomStatIndex].value) + (Math.random() > 0.5 ? 1 : -1);
        newStats[randomStatIndex].value = newValue.toString();
        newStats[randomStatIndex].change = `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`;
        newStats[randomStatIndex].changeType = Math.random() > 0.5 ? 'positive' : 'negative';
      }
      
      setStats(newStats);
      
      const newFinancialStats = [...financialStats];
      const randomFinancialIndex = Math.floor(Math.random() * newFinancialStats.length);
      const currentValue = parseFloat(newFinancialStats[randomFinancialIndex].value.replace('$', '').replace(',', ''));
      const newValue = currentValue + (Math.random() > 0.5 ? 100 : -100);
      newFinancialStats[randomFinancialIndex].value = `$${newValue.toLocaleString()}`;
      newFinancialStats[randomFinancialIndex].change = `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`;
      newFinancialStats[randomFinancialIndex].changeType = newFinancialStats[randomFinancialIndex].name === "Costs (USD)" 
        ? (newFinancialStats[randomFinancialIndex].change.startsWith('+') ? 'negative' : 'positive')
        : (newFinancialStats[randomFinancialIndex].change.startsWith('+') ? 'positive' : 'negative');
      
      setFinancialStats(newFinancialStats);
      
      const updatedCostsBreakdown = { ...costsBreakdown };
      
      if (Math.random() > 0.5) {
        const changeAmount = Math.floor(Math.random() * 200);
        updatedCostsBreakdown.maintenance.service += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.maintenance.repairs += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.maintenance.total = 
          updatedCostsBreakdown.maintenance.service + updatedCostsBreakdown.maintenance.repairs;
      }
      
      if (Math.random() > 0.5) {
        const changeAmount = Math.floor(Math.random() * 200);
        updatedCostsBreakdown.fuel.diesel += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.fuel.petrol += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.fuel.total = 
          updatedCostsBreakdown.fuel.diesel + updatedCostsBreakdown.fuel.petrol;
      }
      
      setCostsBreakdown(updatedCostsBreakdown);
      
      // Update recent activities with random new activity
      if (Math.random() > 0.7) {
        const activityTypes = ["trip", "maintenance", "vehicle", "driver", "client", "fuel"];
        const icons = ["Calendar", "Wrench", "Car", "UserPlus", "Building", "Fuel"];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)] as "trip" | "maintenance" | "vehicle" | "driver" | "client" | "fuel";
        const randomIcon = icons[activityTypes.indexOf(randomType)];
        
        const newActivity: ActivityItemProps = {
          id: Date.now(),
          title: `New ${randomType} activity generated`,
          timestamp: "Just now",
          type: randomType,
          icon: randomIcon
        };
        
        const updatedActivities = [newActivity, ...recentActivities.slice(0, 5)];
        setRecentActivities(updatedActivities);
      }
      
      // Simulate some new alerts occasionally
      if (Math.random() > 0.8) {
        const alertTypes = ["high", "medium", "low"];
        const alertTitles = [
          "Vehicle maintenance due", 
          "Low fuel alert", 
          "Driver license expiring",
          "Vehicle inspection needed",
          "Insurance renewal required"
        ];
        
        const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)] as "high" | "medium" | "low";
        const randomTitle = alertTitles[Math.floor(Math.random() * alertTitles.length)];
        
        const newAlert: AlertItemProps = {
          id: Date.now(),
          title: randomTitle,
          priority: randomType,
          date: "Today"
        };
        
        const updatedAlerts = [newAlert, ...recentAlerts.slice(0, 4)];
        setRecentAlerts(updatedAlerts);
        
        if (randomType === "high") {
          toast.error(`High Priority Alert: ${randomTitle}`);
        } else if (randomType === "medium") {
          toast.warning(`Medium Priority Alert: ${randomTitle}`);
        }
      }
      
      // Occasionally update the upcoming trips
      if (Math.random() > 0.85) {
        const destinations = ["Airport", "Corporate Office", "Hotel", "Conference Center", "Client Site"];
        const clients = ["Acme Corp", "GlobalTech", "Initech", "Wayne Enterprises", "Stark Industries"];
        const drivers = ["John Smith", "Emma Davis", "Michael Johnson", "Sarah Williams", "Robert Brown"];
        
        const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        // Get a random date in the next 7 days
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
        const dateStr = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const newTrip: TripItemProps = {
          id: Date.now(),
          client: randomClient,
          destination: randomDestination,
          date: dateStr,
          driver: randomDriver
        };
        
        // Add new trip at a random position in the list
        const updatedTrips = [...upcomingTrips];
        const insertPosition = Math.floor(Math.random() * updatedTrips.length);
        updatedTrips.splice(insertPosition, 0, newTrip);
        
        // Keep the list at 5 items max
        setUpcomingTrips(updatedTrips.slice(0, 5));
        
        toast.info(`New trip scheduled: ${randomClient} to ${randomDestination}`);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Failed to update dashboard data");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fleet Management Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Real-time overview and analytics for your fleet operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchDashboardData}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Activity className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-1"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Cost Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Alerts</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              stats={stats} 
              financialStats={financialStats} 
              upcomingTrips={upcomingTrips}
              recentActivities={recentActivities}
            />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
          
          <TabsContent value="costs">
            <CostsTab costsBreakdown={costsBreakdown} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertsTab recentAlerts={recentAlerts} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
