import { useState, useEffect } from "react";
import { Bell, Check, Clock, AlertTriangle, Calendar, Car, FileText, User, Shield, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AlertPriority = "high" | "medium" | "low";
type AlertCategory = "vehicle" | "driver" | "maintenance" | "system";
type AlertStatus = "active" | "acknowledged" | "resolved";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: AlertPriority;
  category: AlertCategory;
  status: AlertStatus;
  related_id?: string;
  related_entity?: string;
}

export default function Alerts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Use the useQuery hook to fetch data
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, registration, insurance_expiry, status')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, license_expiry, status')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          id, 
          date, 
          description, 
          status,
          vehicle:vehicles (
            id, 
            make, 
            model, 
            registration
          )
        `)
        .eq('status', 'scheduled');
      
      if (error) throw error;
      return data;
    },
  });

  // Generate alerts based on the fetched data
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const generatedAlerts: AlertItem[] = [];
    
    // Insurance expiry alerts
    vehicles?.forEach(vehicle => {
      if (vehicle.insurance_expiry) {
        const expiryDate = new Date(vehicle.insurance_expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          generatedAlerts.push({
            id: `ins-${vehicle.id}`,
            title: `Insurance Expiring Soon`,
            description: `Insurance for ${vehicle.make} ${vehicle.model} (${vehicle.registration}) will expire in ${daysUntilExpiry} days.`,
            date: new Date().toISOString(),
            priority: daysUntilExpiry <= 7 ? "high" : "medium",
            category: "vehicle",
            status: "active",
            related_id: vehicle.id,
            related_entity: "vehicle"
          });
        } else if (daysUntilExpiry <= 0) {
          generatedAlerts.push({
            id: `ins-exp-${vehicle.id}`,
            title: `Insurance Expired`,
            description: `Insurance for ${vehicle.make} ${vehicle.model} (${vehicle.registration}) has expired.`,
            date: new Date().toISOString(),
            priority: "high",
            category: "vehicle",
            status: "active",
            related_id: vehicle.id,
            related_entity: "vehicle"
          });
        }
      }
    });
    
    // Driver license expiry alerts
    drivers?.forEach(driver => {
      if (driver.license_expiry) {
        const expiryDate = new Date(driver.license_expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          generatedAlerts.push({
            id: `lic-${driver.id}`,
            title: `Driver License Expiring Soon`,
            description: `License for ${driver.name} will expire in ${daysUntilExpiry} days.`,
            date: new Date().toISOString(),
            priority: daysUntilExpiry <= 7 ? "high" : "medium",
            category: "driver",
            status: "active",
            related_id: driver.id,
            related_entity: "driver"
          });
        } else if (daysUntilExpiry <= 0) {
          generatedAlerts.push({
            id: `lic-exp-${driver.id}`,
            title: `Driver License Expired`,
            description: `License for ${driver.name} has expired.`,
            date: new Date().toISOString(),
            priority: "high",
            category: "driver",
            status: "active",
            related_id: driver.id,
            related_entity: "driver"
          });
        }
      }
    });
    
    // Scheduled maintenance alerts
    maintenance?.forEach(item => {
      const maintenanceDate = new Date(item.date);
      const today = new Date();
      const daysUntilMaintenance = Math.floor((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilMaintenance <= 3 && daysUntilMaintenance >= 0) {
        generatedAlerts.push({
          id: `maint-${item.id}`,
          title: `Upcoming Maintenance`,
          description: `Scheduled maintenance for ${item.vehicle?.make} ${item.vehicle?.model} (${item.description}) is due in ${daysUntilMaintenance} days.`,
          date: new Date().toISOString(),
          priority: daysUntilMaintenance === 0 ? "high" : "medium",
          category: "maintenance",
          status: "active",
          related_id: item.id,
          related_entity: "maintenance"
        });
      }
    });
    
    // Add a few system alerts for demonstration
    generatedAlerts.push({
      id: "system-1",
      title: "System Update Available",
      description: "A new version of the fleet management system is available. Please update at your earliest convenience.",
      date: new Date().toISOString(),
      priority: "low",
      category: "system",
      status: "active"
    });
    
    setAlerts(generatedAlerts);
  }, [vehicles, drivers, maintenance]);

  // Filter alerts based on active tab
  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === "all") return true;
    if (activeTab === "high" && alert.priority === "high") return true;
    if (activeTab === "active" && alert.status === "active") return true;
    if (activeTab === "acknowledged" && alert.status === "acknowledged") return true;
    if (activeTab === "resolved" && alert.status === "resolved") return true;
    return false;
  });

  // Mutations for alert actions
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => {
      return Promise.resolve(); // In a real app, this would be an API call
    },
    onSuccess: (_, alertId) => {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, status: "acknowledged" } : alert
        )
      );
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => {
      return Promise.resolve(); // In a real app, this would be an API call
    },
    onSuccess: (_, alertId) => {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, status: "resolved" } : alert
        )
      );
    }
  });

  const getAlertIcon = (category: AlertCategory) => {
    switch (category) {
      case "vehicle": return <Car className="h-5 w-5" />;
      case "driver": return <User className="h-5 w-5" />;
      case "maintenance": return <Wrench className="h-5 w-5" />;
      case "system": return <Shield className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "acknowledged": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Alerts</h2>
          <p className="text-muted-foreground">View and manage system alerts</p>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No alerts found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map(alert => (
              <Card key={alert.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${
                        alert.category === "vehicle" ? "bg-blue-100 dark:bg-blue-900/30" :
                        alert.category === "driver" ? "bg-purple-100 dark:bg-purple-900/30" :
                        alert.category === "maintenance" ? "bg-amber-100 dark:bg-amber-900/30" :
                        "bg-green-100 dark:bg-green-900/30"
                      }`}>
                        {getAlertIcon(alert.category)}
                      </div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{alert.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(alert.date).toLocaleString()}
                  </p>
                </CardContent>
                {alert.status !== "resolved" && (
                  <CardFooter className="bg-muted/50 border-t flex justify-end space-x-2 py-2">
                    {alert.status === "active" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                      >
                        <Clock className="h-4 w-4 mr-1" /> Acknowledge
                      </Button>
                    )}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                    >
                      <Check className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <style>
        {`.priority-high { color: #ef4444; }
        .priority-medium { color: #f59e0b; }
        .priority-low { color: #3b82f6; }`}
      </style>
    </div>
  );
}
