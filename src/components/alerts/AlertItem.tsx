
import { Alert } from "@/types/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Car, Users, Fuel, Check, Wrench, FileBadge } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AlertItemProps {
  alert: Alert;
  onResolve: (id: string) => void;
}

export const AlertItem = ({ alert, onResolve }: AlertItemProps) => {
  const getIconByType = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5 text-amber-500" />;
      case "trip":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "vehicle":
        return <Car className="h-5 w-5 text-purple-500" />;
      case "driver":
        return <Users className="h-5 w-5 text-green-500" />;
      case "fuel":
        return <Fuel className="h-5 w-5 text-red-500" />;
      case "contract":
        return <FileBadge className="h-5 w-5 text-indigo-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date with fallback to current date if date is invalid
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PP");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return format(new Date(), "PP");
    }
  };

  return (
    <Card className={`border-l-4 ${
      alert.priority === "high" 
        ? "border-l-red-500" 
        : alert.priority === "medium"
        ? "border-l-amber-500"
        : "border-l-blue-500"
    } ${alert.resolved ? "opacity-60 bg-gray-50 dark:bg-gray-800/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            {getIconByType(alert.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-base">{alert.title}</h3>
            {alert.description && (
              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
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
              <span className="text-xs text-muted-foreground">
                {formatDate(alert.date)}
              </span>
            </div>
          </div>
          {!alert.resolved && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 sm:mt-0 flex items-center gap-1"
              onClick={() => onResolve(alert.id)}
            >
              <Check className="h-4 w-4" /> Resolve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
