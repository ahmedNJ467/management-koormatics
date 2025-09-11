
import { Activity, AlertCircle, Wifi } from "lucide-react";

interface ActivityEmptyStateProps {
  type: "empty" | "error" | "connection-error";
}

export const ActivityEmptyState = ({ type }: ActivityEmptyStateProps) => {
  const getContent = () => {
    switch (type) {
      case "connection-error":
        return {
          icon: <Wifi className="h-8 w-8 text-muted-foreground" />,
          title: "Connection Error",
          description: "Unable to connect to the database. Please check your connection."
        };
      case "error":
        return {
          icon: <AlertCircle className="h-8 w-8 text-muted-foreground" />,
          title: "Error Loading Activities",
          description: "There was an error loading recent activities. Please try again."
        };
      default:
        return {
          icon: <Activity className="h-8 w-8 text-muted-foreground" />,
          title: "No Activities",
          description: "No recent activities to display."
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center bg-card">
      {content.icon}
      <h3 className="mt-4 text-lg font-medium text-card-foreground">{content.title}</h3>
      <div className="mt-2 text-sm text-muted-foreground">{content.description}</div>
    </div>
  );
};
