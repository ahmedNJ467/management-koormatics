
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAlertsData } from "@/hooks/use-alerts-data";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const AlertsTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch only active (unresolved) alerts and limit to 5
  const { data: alerts, isLoading, error } = useAlertsData({ 
    resolved: false,
    limit: 5
  });
  
  // Set up real-time listener for alerts table
  useEffect(() => {
    const alertsChannel = supabase
      .channel('alerts-dashboard-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, [queryClient]);

  // Transform alerts data for the component
  const formattedAlerts = (alerts || []).map((alert) => ({
    id: alert.id,
    title: alert.title,
    priority: alert.priority,
    date: formatDistanceToNow(new Date(alert.date), { addSuffix: true })
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

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Failed to load alerts. Please try again.
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
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => navigate('/alerts')}
          >
            Manage all alerts
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
