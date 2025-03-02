
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Calendar, Car, ArrowDown, ArrowUp, Filter, X, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, Maintenance, Driver, FuelLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type AlertItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: "high" | "medium" | "low";
  category: "maintenance" | "vehicle" | "driver" | "fuel" | "other";
  status: "new" | "acknowledged" | "resolved";
  related_id?: string;
};

export default function Alerts() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [activeTab, setActiveTab] = useState<"all" | "new" | "acknowledged" | "resolved">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*');
      
      if (error) throw error;
      return data as Driver[];
    },
  });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*');
      
      if (error) throw error;
      return data as Maintenance[];
    },
  });

  // Generate system alerts based on vehicle, driver, and maintenance data
  const generateSystemAlerts = (): AlertItem[] => {
    const alerts: AlertItem[] = [];
    const today = new Date();
    
    // Vehicle insurance expiry alerts
    vehicles?.forEach(vehicle => {
      if (vehicle.insurance_expiry) {
        const expiryDate = new Date(vehicle.insurance_expiry);
        const daysToExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          alerts.push({
            id: `vehicle-insurance-${vehicle.id}`,
            title: `Vehicle insurance expiring soon`,
            description: `${vehicle.make} ${vehicle.model} (${vehicle.registration}) insurance expires in ${daysToExpiry} days`,
            date: today.toISOString().split('T')[0],
            priority: daysToExpiry <= 7 ? "high" : "medium",
            category: "vehicle",
            status: "new",
            related_id: vehicle.id
          });
        } else if (daysToExpiry <= 0) {
          alerts.push({
            id: `vehicle-insurance-expired-${vehicle.id}`,
            title: `Vehicle insurance expired`,
            description: `${vehicle.make} ${vehicle.model} (${vehicle.registration}) insurance has expired`,
            date: today.toISOString().split('T')[0],
            priority: "high",
            category: "vehicle",
            status: "new",
            related_id: vehicle.id
          });
        }
      }
    });
    
    // Driver license expiry alerts
    drivers?.forEach(driver => {
      if (driver.license_expiry) {
        const expiryDate = new Date(driver.license_expiry);
        const daysToExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          alerts.push({
            id: `driver-license-${driver.id}`,
            title: `Driver license expiring soon`,
            description: `${driver.name}'s driving license expires in ${daysToExpiry} days`,
            date: today.toISOString().split('T')[0],
            priority: daysToExpiry <= 7 ? "high" : "medium",
            category: "driver",
            status: "new",
            related_id: driver.id
          });
        } else if (daysToExpiry <= 0) {
          alerts.push({
            id: `driver-license-expired-${driver.id}`,
            title: `Driver license expired`,
            description: `${driver.name}'s driving license has expired`,
            date: today.toISOString().split('T')[0],
            priority: "high",
            category: "driver",
            status: "new",
            related_id: driver.id
          });
        }
      }
    });
    
    // Scheduled maintenance alerts
    maintenance?.forEach(item => {
      if (item.status === 'scheduled') {
        const maintenanceDate = new Date(item.date);
        const daysToMaintenance = Math.floor((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToMaintenance <= 7 && daysToMaintenance > 0) {
          alerts.push({
            id: `maintenance-${item.id}`,
            title: `Scheduled maintenance upcoming`,
            description: `Maintenance scheduled in ${daysToMaintenance} days: ${item.description}`,
            date: today.toISOString().split('T')[0],
            priority: daysToMaintenance <= 2 ? "high" : "medium",
            category: "maintenance",
            status: "new",
            related_id: item.id
          });
        } else if (daysToMaintenance < 0) {
          alerts.push({
            id: `maintenance-overdue-${item.id}`,
            title: `Scheduled maintenance overdue`,
            description: `Maintenance is overdue by ${Math.abs(daysToMaintenance)} days: ${item.description}`,
            date: today.toISOString().split('T')[0],
            priority: "high",
            category: "maintenance",
            status: "new",
            related_id: item.id
          });
        }
      }
    });
    
    // Generate some random fuel alerts
    if (Math.random() > 0.5) {
      alerts.push({
        id: `fuel-consumption-alert-${Date.now()}`,
        title: "Abnormal fuel consumption detected",
        description: "Vehicle TG-346-H has shown 28% higher than average fuel consumption in the last 30 days",
        date: today.toISOString().split('T')[0],
        priority: "medium",
        category: "fuel",
        status: "new"
      });
    }
    
    // Add some variety with random alerts
    const randomAlerts = [
      {
        id: `random-alert-1`,
        title: "System maintenance scheduled",
        description: "A system maintenance is scheduled for tonight at 2:00 AM. You may experience brief service interruptions.",
        date: today.toISOString().split('T')[0],
        priority: "low",
        category: "other",
        status: "new"
      },
      {
        id: `random-alert-2`,
        title: "High vehicle utilization detected",
        description: "Vehicle XY-122-G has been in continuous operation for 14 hours.",
        date: today.toISOString().split('T')[0],
        priority: "medium",
        category: "vehicle",
        status: "new"
      },
      {
        id: `random-alert-3`,
        title: "Driver hours compliance warning",
        description: "Driver John Smith is approaching maximum allowed driving hours for this week.",
        date: today.toISOString().split('T')[0],
        priority: "high",
        category: "driver",
        status: "new"
      }
    ];
    
    // Add some of the random alerts
    randomAlerts.forEach(alert => {
      if (Math.random() > 0.6) {
        alerts.push(alert);
      }
    });
    
    return alerts;
  };

  const [systemAlerts, setSystemAlerts] = useState<AlertItem[]>([]);
  
  useEffect(() => {
    // Load alerts
    const loadedAlerts = generateSystemAlerts();
    setSystemAlerts(loadedAlerts);
    
    // Set up auto-refresh if enabled
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => {
        setSystemAlerts(generateSystemAlerts());
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [vehicles, drivers, maintenance, autoRefresh]);
  
  const filteredAlerts = systemAlerts.filter(alert => {
    if (filter !== "all" && alert.priority !== filter) {
      return false;
    }
    
    if (activeTab !== "all" && alert.status !== activeTab) {
      return false;
    }
    
    return true;
  });

  const handleAcknowledge = (id: string) => {
    setSystemAlerts(alerts => 
      alerts.map(alert => 
        alert.id === id 
          ? { ...alert, status: "acknowledged" } 
          : alert
      )
    );
    
    toast({
      title: "Alert acknowledged",
      description: "The alert has been marked as acknowledged"
    });
  };

  const handleResolve = (id: string) => {
    setSystemAlerts(alerts => 
      alerts.map(alert => 
        alert.id === id 
          ? { ...alert, status: "resolved" } 
          : alert
      )
    );
    
    toast({
      title: "Alert resolved",
      description: "The alert has been marked as resolved"
    });
  };

  const handleClearAll = () => {
    setSystemAlerts([]);
    toast({
      title: "All alerts cleared",
      description: "All alerts have been removed from the system"
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Alerts</h2>
          <p className="text-muted-foreground">System notifications and warnings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {activeTab === "all" ? "All Alerts" : 
                  activeTab === "new" ? "New Alerts" : 
                  activeTab === "acknowledged" ? "Acknowledged Alerts" : 
                  "Resolved Alerts"}
                <Badge variant="outline" className="ml-3 bg-secondary">
                  {filteredAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                  <p className="mt-2 text-muted-foreground">No alerts to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <Alert key={alert.id} className="relative border-l-4 pl-6 pr-10" 
                      style={{ 
                        borderLeftColor: 
                          alert.priority === "high" ? "var(--alert-priority-high)" :
                          alert.priority === "medium" ? "var(--alert-priority-medium)" :
                          "var(--alert-priority-low)" 
                      }}
                    >
                      <style jsx>{`
                        :root {
                          --alert-priority-high: hsl(var(--destructive));
                          --alert-priority-medium: hsl(var(--warning));
                          --alert-priority-low: hsl(var(--info));
                        }
                      `}</style>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-base">{alert.title}</h4>
                          <AlertDescription className="text-sm mt-1">
                            {alert.description}
                          </AlertDescription>
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            <Badge variant="outline" className={
                              alert.priority === "high" ? "border-red-500 text-red-500" :
                              alert.priority === "medium" ? "border-amber-500 text-amber-500" :
                              "border-blue-500 text-blue-500"
                            }>
                              {alert.priority}
                            </Badge>
                            <Badge variant="outline" className={
                              alert.category === "maintenance" ? "border-blue-500 text-blue-500" :
                              alert.category === "vehicle" ? "border-green-500 text-green-500" :
                              alert.category === "driver" ? "border-purple-500 text-purple-500" :
                              alert.category === "fuel" ? "border-amber-500 text-amber-500" :
                              "border-gray-500 text-gray-500"
                            }>
                              {alert.category}
                            </Badge>
                            <Badge variant="outline" className={
                              alert.status === "new" ? "border-red-500 text-red-500" :
                              alert.status === "acknowledged" ? "border-amber-500 text-amber-500" :
                              "border-green-500 text-green-500"
                            }>
                              {alert.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{alert.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 md:mt-0 mt-2">
                          {alert.status === "new" && (
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                              <Bell className="h-4 w-4 mr-1" /> Acknowledge
                            </Button>
                          )}
                          {(alert.status === "new" || alert.status === "acknowledged") && (
                            <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                              <Check className="h-4 w-4 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
