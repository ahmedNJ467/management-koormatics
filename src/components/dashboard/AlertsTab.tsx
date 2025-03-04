
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertItemProps } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertsTabProps {
  recentAlerts: AlertItemProps[];
  isLoading?: boolean;
}

export const AlertsTab = ({ recentAlerts, isLoading = false }: AlertsTabProps) => {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </>
      ) : recentAlerts.length > 0 ? (
        recentAlerts.map((alert) => (
          <Alert key={alert.id} className="flex items-center justify-between">
            <AlertDescription className="flex-1">
              {alert.title}
            </AlertDescription>
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-muted-foreground">{alert.date}</span>
            </div>
          </Alert>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No alerts at this time
        </div>
      )}
    </div>
  );
};
