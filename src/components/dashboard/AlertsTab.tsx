
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Clock, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const AlertsTab = () => {
  const { toast } = useToast();
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  
  // Query for active alerts
  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Alert[];
    }
  });

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true })
        .eq("id", alertId);
      
      if (error) throw error;
      
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 space-y-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted animate-pulse">
          <BellRing className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="w-full h-20 rounded-md bg-muted animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <Bell className="w-8 h-8 mb-2 text-muted-foreground" />
        <p>Failed to load alerts. Please try again later.</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <Bell className="w-8 h-8 mb-2 text-muted-foreground" />
        <p>No active alerts at the moment.</p>
        <p className="text-xs mt-1">All systems running smoothly.</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'maintenance':
        return <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/20"><Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>;
      case 'driver':
        return <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20"><CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /></div>;
      case 'vehicle':
        return <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/20"><Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>;
      default:
        return <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20"><Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800/50"
        >
          <div 
            className="p-3 cursor-pointer flex items-start gap-3"
            onClick={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
          >
            {getTypeIcon(alert.type)}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <Badge className={`ml-2 ${getPriorityColor(alert.priority)}`}>
                  {alert.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(alert.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {expandedAlertId === alert.id && (
            <div className="px-3 pb-3 pt-0 border-t mt-1">
              {alert.description && (
                <p className="text-sm my-2">{alert.description}</p>
              )}
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => handleResolveAlert(alert.id)}
                >
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
