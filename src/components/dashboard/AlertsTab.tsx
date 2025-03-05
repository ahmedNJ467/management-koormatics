
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertItemProps } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BellRing, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AlertsTabProps {
  recentAlerts: AlertItemProps[];
  isLoading?: boolean;
}

export const AlertsTab = ({ recentAlerts, isLoading = false }: AlertsTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {isLoading ? (
        <>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </>
      ) : recentAlerts.length > 0 ? (
        <>
          {recentAlerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-l-4 ${
                alert.priority === "high" 
                  ? "border-l-red-500" 
                  : alert.priority === "medium" 
                  ? "border-l-amber-500" 
                  : "border-l-blue-500"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                  alert.priority === "high" 
                    ? "text-red-500" 
                    : alert.priority === "medium" 
                    ? "text-amber-500" 
                    : "text-blue-500"
                }`} />
                <AlertDescription className="flex-1 mb-2 sm:mb-0">
                  {alert.title}
                </AlertDescription>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Badge
                  variant="outline"
                  className={
                    alert.priority === "high"
                      ? "border-red-500 text-red-500"
                      : alert.priority === "medium"
                      ? "border-amber-500 text-amber-500"
                      : "border-blue-500 text-blue-500"
                  }
                >
                  {alert.priority}
                </Badge>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{alert.date}</span>
              </div>
            </Alert>
          ))}
        
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center gap-1"
            onClick={() => navigate('/alerts')}
          >
            View all alerts <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
          <BellRing className="h-8 w-8 mb-2 text-muted-foreground/50" />
          <p>No alerts at this time</p>
        </div>
      )}
    </div>
  );
};
