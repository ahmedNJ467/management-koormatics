
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@/types/alert";

// In-memory storage for alerts
const alerts: Alert[] = [
  {
    id: "1",
    title: "Low fuel level detected in vehicle TRUCK-001",
    priority: "high",
    date: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved: false,
    type: "vehicle",
    description: "Vehicle TRUCK-001 has fuel level below 15%. Refueling recommended."
  },
  {
    id: "2",
    title: "Maintenance due for vehicle SUV-003",
    priority: "medium",
    date: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved: false,
    type: "maintenance",
    description: "Regular maintenance due in 2 days. Schedule service appointment."
  },
  {
    id: "3",
    title: "Driver license expiring soon - John Smith",
    priority: "medium",
    date: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved: false,
    type: "driver",
    description: "Driver license will expire in 14 days. Renewal required."
  },
  {
    id: "4",
    title: "Trip delayed - Airport pickup #T-2023-089",
    priority: "low",
    date: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 days ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved: false,
    type: "trip",
    description: "Trip delayed by 15 minutes due to traffic conditions."
  }
];

// Format timestamps in a human-readable format
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

// Get active alerts
const getActiveAlerts = (): Alert[] => {
  return alerts.filter(alert => !alert.resolved);
};

// Resolve an alert
const resolveAlert = (id: string): void => {
  const alertIndex = alerts.findIndex(alert => alert.id === id);
  if (alertIndex !== -1) {
    alerts[alertIndex].resolved = true;
    alerts[alertIndex].updated_at = new Date().toISOString();
  }
};

export const AlertsTab = () => {
  const { toast } = useToast();
  const [alertItems, setAlertItems] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time
    const loadTimer = setTimeout(() => {
      setAlertItems(getActiveAlerts());
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(loadTimer);
  }, []);

  // Function to mark an alert as resolved
  const handleResolveAlert = (id: string) => {
    resolveAlert(id);
    setAlertItems(getActiveAlerts());
    
    toast({
      title: "Alert resolved",
      description: "The alert has been marked as resolved."
    });
  };

  // Transform alerts data for the component
  const formattedAlerts = alertItems.map(alert => ({
    id: alert.id,
    title: alert.title,
    priority: alert.priority,
    date: formatTimestamp(new Date(alert.date))
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {formattedAlerts.length > 0 ? (
        <>
          {formattedAlerts.map((alert) => (
            <div key={alert.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-150 flex items-start space-x-3">
              <div className={`p-2 rounded-full shadow-sm ${
                alert.priority === "high" 
                  ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/30" 
                  : alert.priority === "medium"
                  ? "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/30"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  alert.priority === "high" 
                    ? "text-red-500" 
                    : alert.priority === "medium"
                    ? "text-amber-500"
                    : "text-blue-500"
                }`} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`
                    ${alert.priority === "high" 
                      ? "border-red-500 text-red-600 dark:text-red-400" 
                      : alert.priority === "medium"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-blue-500 text-blue-600 dark:text-blue-400"
                    }
                  `}>
                    {alert.priority}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" /> {alert.date}
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => handleResolveAlert(alert.id)}
              >
                Resolve
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => {
              // Refresh alerts on button click
              setAlertItems(getActiveAlerts());
            }}
          >
            Refresh alerts
          </Button>
        </>
      ) : (
        <div className="text-center py-8 flex flex-col items-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
          <p>No active alerts</p>
        </div>
      )}
    </div>
  );
};
