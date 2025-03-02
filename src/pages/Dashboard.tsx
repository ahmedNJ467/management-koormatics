
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Car, Users, Wrench, Fuel, TrendingUp, TrendingDown, Bell, Calendar, BarChart2, PieChart, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

// Sample data - would be replaced by real data from Supabase
const monthlyData = [
  { month: "Jan", vehicles: 20, maintenance: 2, revenue: 15000 },
  { month: "Feb", vehicles: 22, maintenance: 3, revenue: 16500 },
  { month: "Mar", vehicles: 21, maintenance: 2, revenue: 15800 },
  { month: "Apr", vehicles: 23, maintenance: 4, revenue: 17200 },
  { month: "May", vehicles: 24, maintenance: 3, revenue: 18000 },
  { month: "Jun", vehicles: 24, maintenance: 3, revenue: 18500 },
];

const fuelConsumptionData = [
  { month: "Jan", consumption: 2500 },
  { month: "Feb", consumption: 2300 },
  { month: "Mar", consumption: 2400 },
  { month: "Apr", consumption: 2200 },
  { month: "May", consumption: 2100 },
  { month: "Jun", consumption: 2000 },
];

const fleetDistributionData = [
  { name: "Sedans", value: 10, color: "#10B981" },
  { name: "SUVs", value: 7, color: "#3B82F6" },
  { name: "Trucks", value: 4, color: "#8B5CF6" },
  { name: "Vans", value: 3, color: "#F97316" },
];

const driverStatusData = [
  { name: "Active", value: 18, color: "#10B981" },
  { name: "On Leave", value: 3, color: "#F97316" },
  { name: "Inactive", value: 2, color: "#EF4444" },
];

export default function Dashboard() {
  const [stats, setStats] = useState([
    {
      name: "Total Vehicles",
      value: "24",
      icon: Car,
      change: "+2.5%",
      changeType: "positive",
    },
    {
      name: "Active Drivers",
      value: "18",
      icon: Users,
      change: "0%",
      changeType: "neutral",
    },
    {
      name: "Maintenance Due",
      value: "3",
      icon: Wrench,
      change: "-1",
      changeType: "negative",
    },
    {
      name: "Fuel Efficiency",
      value: "92%",
      icon: Fuel,
      change: "+4.3%",
      changeType: "positive",
    },
  ]);
  
  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, title: "Vehicle KSB 123G due for service", priority: "high", date: "Today" },
    { id: 2, title: "Driver license expiring", priority: "medium", date: "Tomorrow" },
    { id: 3, title: "Fuel consumption above average", priority: "low", date: "2 days ago" },
  ]);

  const [upcomingTrips, setUpcomingTrips] = useState([
    { id: 1, client: "Acme Corp", destination: "Nairobi CBD", date: "Today, 2:00 PM", driver: "John Doe" },
    { id: 2, client: "XYZ Industries", destination: "Mombasa Road", date: "Tomorrow, 9:00 AM", driver: "Jane Smith" },
    { id: 3, client: "Global Enterprises", destination: "Karen", date: "Jun 15, 10:30 AM", driver: "David Johnson" },
  ]);

  // Setup realtime subscription
  useEffect(() => {
    // Subscribe to changes in the vehicles table
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, (payload) => {
        console.log('Vehicles change received:', payload);
        // Update dashboard data
        fetchDashboardData();
      })
      .subscribe();

    // Subscribe to changes in the drivers table
    const driversChannel = supabase
      .channel('drivers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'drivers' 
      }, (payload) => {
        console.log('Drivers change received:', payload);
        // Update dashboard data
        fetchDashboardData();
      })
      .subscribe();

    // Initially fetch data
    fetchDashboardData();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(driversChannel);
    };
  }, []);

  // Fetch dashboard data from Supabase
  const fetchDashboardData = async () => {
    try {
      // These would be replaced with actual Supabase queries
      // For now, we'll simulate data updates
      console.log('Fetching dashboard data...');
      
      // For demonstration purposes, randomly update a stat value
      const newStats = [...stats];
      const randomStatIndex = Math.floor(Math.random() * newStats.length);
      
      if (randomStatIndex === 0) { // Total Vehicles
        const newValue = parseInt(newStats[randomStatIndex].value) + (Math.random() > 0.5 ? 1 : -1);
        newStats[randomStatIndex].value = newValue.toString();
        newStats[randomStatIndex].change = `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`;
        newStats[randomStatIndex].changeType = Math.random() > 0.5 ? 'positive' : 'negative';
      }
      
      setStats(newStats);
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
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Key Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <div
                    className={`rounded-full p-2.5 ${
                      stat.changeType === "positive"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : stat.changeType === "negative"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    } flex items-center mt-1`}>
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : stat.changeType === "negative" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Primary Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Fleet Overview
                </CardTitle>
                <CardDescription>
                  Monthly vehicles and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="vehicles" fill="hsl(var(--primary))" name="Total Vehicles" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="maintenance" fill="hsl(var(--destructive))" name="In Maintenance" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly revenue in USD
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Trips
              </CardTitle>
              <CardDescription>
                Scheduled trips for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 p-4 text-sm font-medium bg-muted/50">
                  <div>Client</div>
                  <div>Destination</div>
                  <div>Date & Time</div>
                  <div>Driver</div>
                </div>
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="grid grid-cols-4 p-4 text-sm border-t">
                    <div className="font-medium">{trip.client}</div>
                    <div>{trip.destination}</div>
                    <div>{trip.date}</div>
                    <div>{trip.driver}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {/* Fuel Consumption Trend */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fuel className="h-4 w-4 mr-2" />
                Fuel Consumption Trend
              </CardTitle>
              <CardDescription>
                Monthly fuel consumption in liters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelConsumptionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                    <YAxis className="text-muted-foreground text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                      labelStyle={{ fontWeight: 'bold' }}
                      formatter={(value) => [`${value} L`, 'Consumption']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Pie Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Fleet Distribution
                </CardTitle>
                <CardDescription>
                  Vehicles by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={fleetDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {fleetDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value) => [`${value} vehicles`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Driver Status
                </CardTitle>
                <CardDescription>
                  Driver availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={driverStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {driverStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value) => [`${value} drivers`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Recent Alerts
            </h3>
            
            {recentAlerts.map((alert) => (
              <Alert key={alert.id} className="relative">
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={
                      alert.priority === "high" 
                        ? "bg-red-500" 
                        : alert.priority === "medium" 
                        ? "bg-amber-500" 
                        : "bg-blue-500"
                    }
                  >
                    {alert.priority}
                  </Badge>
                </div>
                <AlertDescription className="flex justify-between items-start flex-col sm:flex-row">
                  <div>{alert.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 sm:mt-0">{alert.date}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
