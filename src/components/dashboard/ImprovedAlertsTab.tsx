
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, AlertTriangle, CheckCircle, Car, Wrench, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activity-logger";

export const ImprovedAlertsTab = () => {
  const { toast } = useToast();
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  
  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Alert[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds instead of relying on realtime
  });

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true })
        .eq("id", alertId);
      
      if (error) throw error;
      
      await logActivity({
        title: "Alert resolved",
        type: "maintenance",
        relatedId: alertId
      });
      
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
      
      refetch();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      toast({
        title: "Error",
        description: "Failed to resolve the alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
      priority === 'high' ? 'text-red-500' : 
      priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
    }`;
    
    switch (type.toLowerCase()) {
      case 'maintenance':
        return <Wrench className={iconClass} />;
      case 'vehicle':
        return <Car className={iconClass} />;
      case 'driver':
        return <User className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200"
    };
    
    return (
      <Badge className={variants[priority as keyof typeof variants] || variants.low}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-3 text-red-500" />
        <p className="text-center">Failed to load alerts</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mb-3 text-green-500" />
        <h3 className="font-medium text-lg mb-1">All Clear!</h3>
        <p className="text-center text-sm">No active alerts at the moment.</p>
        <p className="text-center text-xs mt-1">All systems running smoothly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md bg-card"
        >
          <div 
            className="p-4 cursor-pointer"
            onClick={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type, alert.priority)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                  {getPriorityBadge(alert.priority)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(alert.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{alert.type}</span>
                </div>
              </div>
            </div>
          </div>
          
          {expandedAlertId === alert.id && (
            <div className="px-4 pb-4 border-t bg-muted/30">
              {alert.description && (
                <p className="text-sm my-3 text-muted-foreground">{alert.description}</p>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolveAlert(alert.id);
                  }}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
