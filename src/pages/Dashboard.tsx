
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
      
      // Update Stats
      const newStats = [...stats];
      newStats.forEach((stat, index) => {
        const change = Math.random() > 0.5 ? 
          `+${(Math.random() * 3).toFixed(1)}%` : 
          `-${(Math.random() * 2).toFixed(1)}%`;
          
        if (index === 0) { // Active Vehicles
          const newValue = parseInt(stat.value) + (Math.random() > 0.7 ? 1 : 0);
          newStats[index] = { 
            ...stat, 
            value: newValue.toString(),
            change,
            changeType: change.startsWith('+') ? 'positive' : 'negative'
          };
        } else if (index === 1) { // Active Drivers
          const newValue = parseInt(stat.value) + (Math.random() > 0.8 ? 1 : 0);
          newStats[index] = { 
            ...stat, 
            value: newValue.toString(),
            change,
            changeType: change.startsWith('+') ? 'positive' : 'negative'
          };
        } else if (index === 2) { // Completed Trips
          const newValue = parseInt(stat.value) + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0);
          newStats[index] = { 
            ...stat, 
            value: newValue.toString(),
            change,
            changeType: change.startsWith('+') ? 'positive' : 'negative'
          };
        } else if (index === 3) { // Upcoming Trips
          const newValue = parseInt(stat.value) + (Math.random() > 0.6 ? 1 : -1);
          newStats[index] = { 
            ...stat, 
            value: newValue.toString(),
            change,
            changeType: change.startsWith('+') ? 'positive' : 'negative'
          };
        }
      });
      
      setStats(newStats);
      
      // Update Financial Stats
      const newFinancialStats = [...financialStats];
      newFinancialStats.forEach((stat, index) => {
        const currentValue = parseFloat(stat.value.replace('$', '').replace(',', ''));
        const changeAmount = Math.random() * (index === 0 ? 500 : 300);
        const newValue = currentValue + (Math.random() > 0.5 ? changeAmount : -changeAmount);
        const change = Math.random() > 0.5 ? 
          `+${(Math.random() * 3).toFixed(1)}%` : 
          `-${(Math.random() * 2).toFixed(1)}%`;
          
        newFinancialStats[index] = {
          ...stat,
          value: `$${newValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          change,
          changeType: stat.name === "Costs (USD)" 
            ? (change.startsWith('+') ? 'negative' : 'positive')
            : (change.startsWith('+') ? 'positive' : 'negative')
        };
      });
      
      setFinancialStats(newFinancialStats);
      
      // Update Costs Breakdown
      const updatedCostsBreakdown = { ...costsBreakdown };
      
      // Maintenance costs update
      const maintenanceChangeService = Math.floor(Math.random() * 200) * (Math.random() > 0.5 ? 1 : -1);
      const maintenanceChangeRepairs = Math.floor(Math.random() * 300) * (Math.random() > 0.5 ? 1 : -1);
      updatedCostsBreakdown.maintenance.service += maintenanceChangeService;
      updatedCostsBreakdown.maintenance.repairs += maintenanceChangeRepairs;
      updatedCostsBreakdown.maintenance.total = 
        updatedCostsBreakdown.maintenance.service + updatedCostsBreakdown.maintenance.repairs;
      
      // Fuel costs update
      const fuelChangeDiesel = Math.floor(Math.random() * 200) * (Math.random() > 0.5 ? 1 : -1);
      const fuelChangePetrol = Math.floor(Math.random() * 250) * (Math.random() > 0.5 ? 1 : -1);
      updatedCostsBreakdown.fuel.diesel += fuelChangeDiesel;
      updatedCostsBreakdown.fuel.petrol += fuelChangePetrol;
      updatedCostsBreakdown.fuel.total = 
        updatedCostsBreakdown.fuel.diesel + updatedCostsBreakdown.fuel.petrol;
      
      setCostsBreakdown(updatedCostsBreakdown);
      
      // Update Recent Activities
      if (Math.random() > 0.3) {
        const activityTypes = ["trip", "maintenance", "vehicle", "driver", "client", "fuel"];
        const icons = ["Calendar", "Wrench", "Car", "UserPlus", "Building", "Fuel"];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)] as 
          "trip" | "maintenance" | "vehicle" | "driver" | "client" | "fuel";
        const randomIcon = icons[activityTypes.indexOf(randomType)];
        
        const descriptions = {
          trip: ["New trip scheduled", "Trip completed", "Trip rescheduled"],
          maintenance: ["Vehicle serviced", "Maintenance scheduled", "Repair completed"],
          vehicle: ["Vehicle added", "Vehicle status updated", "Vehicle inspection completed"],
          driver: ["New driver added", "Driver schedule updated", "Driver license renewed"],
          client: ["New client added", "Client contract updated", "Client payment received"],
          fuel: ["Fuel log added", "Fuel price updated", "Fuel efficiency report generated"]
        };
        
        const randomDescription = descriptions[randomType][Math.floor(Math.random() * 3)];
        
        const newActivity: ActivityItemProps = {
          id: Date.now(),
          title: randomDescription,
          timestamp: "Just now",
          type: randomType,
          icon: randomIcon
        };
        
        const updatedActivities = [newActivity, ...recentActivities.slice(0, 5)];
        setRecentActivities(updatedActivities);
      }
      
      // Update Alerts if needed (randomly or based on changes)
      if (Math.random() > 0.7) {
        const alertTypes = ["high", "medium", "low"];
        const alertMessages = [
          "Vehicle maintenance due",
          "Driver license expiring",
          "Low fuel alert",
          "Trip schedule conflict",
          "Payment overdue",
          "Service inspection required"
        ];
        
        const newAlert: AlertItemProps = {
          id: Date.now(),
          title: alertMessages[Math.floor(Math.random() * alertMessages.length)],
          priority: alertTypes[Math.floor(Math.random() * alertTypes.length)] as "high" | "medium" | "low",
          date: "Today"
        };
        
        // Show toast for high priority alerts
        if (newAlert.priority === "high") {
          toast({
            title: "High Priority Alert",
            description: newAlert.title,
            variant: "destructive"
          });
        }
        
        const updatedAlerts = [newAlert, ...recentAlerts.slice(0, 9)];
        setRecentAlerts(updatedAlerts);
      }
      
      // Update Upcoming Trips if specifically requested or randomly
      if (updateTrips || Math.random() > 0.6) {
        const clients = ["Acme Corp", "Global Travel", "Executive Tours", "First Class Transit", "VIP Transfers"];
        const destinations = ["Airport", "Hotel", "Conference Center", "Office", "Resort"];
        const drivers = ["John Smith", "Emma Wilson", "Michael Brown", "Sarah Davis", "James Miller"];
        
        const todayDate = new Date();
        const randomDaysAhead = Math.floor(Math.random() * 7) + 1;
        const tripDate = new Date(todayDate);
        tripDate.setDate(todayDate.getDate() + randomDaysAhead);
        
        const formattedDate = `${tripDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${Math.floor(Math.random() * 12 + 1)}:${Math.random() > 0.5 ? '00' : '30'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`;
        
        const newTrip: TripItemProps = {
          id: Date.now(),
          client: clients[Math.floor(Math.random() * clients.length)],
          destination: destinations[Math.floor(Math.random() * destinations.length)],
          date: formattedDate,
          driver: drivers[Math.floor(Math.random() * drivers.length)]
        };
        
        // Show toast for newly added trips
        toast({
          title: "New Trip Scheduled",
          description: `${newTrip.client} to ${newTrip.destination} on ${newTrip.date}`
        });
        
        const updatedTrips = [newTrip, ...upcomingTrips.slice(0, 4)];
        setUpcomingTrips(updatedTrips);
      }
      
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
