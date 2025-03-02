
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

export default function Dashboard() {
  const [stats, setStats] = useState<StatCardProps[]>(initialStats);
  const [financialStats, setFinancialStats] = useState<StatCardProps[]>(initialFinancialStats);
  const [recentAlerts, setRecentAlerts] = useState<AlertItemProps[]>(initialAlerts);
  const [upcomingTrips, setUpcomingTrips] = useState<TripItemProps[]>(initialTrips);
  const [costsBreakdown, setCostsBreakdown] = useState<CostsBreakdownProps>(initialCostsBreakdown);
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(initialRecentActivities);

  useEffect(() => {
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, (payload) => {
        console.log('Vehicles change received:', payload);
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
        fetchDashboardData();
      })
      .subscribe();

    fetchDashboardData();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(fuelLogsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
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
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Fleet management overview and analytics
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
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
    </div>
  );
}
