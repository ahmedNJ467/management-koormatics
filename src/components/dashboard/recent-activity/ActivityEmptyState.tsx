
import { Activity } from "lucide-react";

interface ActivityEmptyStateProps {
  type: 'loading' | 'error' | 'connection-error' | 'empty';
  message?: string;
}

export const ActivityEmptyState = ({ type, message }: ActivityEmptyStateProps) => {
  const getContent = () => {
    switch (type) {
      case 'connection-error':
        return {
          icon: <Activity className="h-8 w-8 mb-2 opacity-50 text-red-500" />,
          title: "Connection Error",
          subtitle: "Unable to connect to the database. Please check your connection.",
          titleClass: "text-red-500 font-medium"
        };
      case 'error':
        return {
          icon: <Activity className="h-8 w-8 mb-2 opacity-50 text-amber-500" />,
          title: "Failed to load activities",
          subtitle: "Please try refreshing the page",
          titleClass: "text-amber-500 font-medium"
        };
      case 'empty':
        return {
          icon: <Activity className="h-8 w-8 mb-2 opacity-50" />,
          title: "No recent activities",
          subtitle: "Check back later for updates",
          titleClass: ""
        };
      default:
        return {
          icon: <Activity className="h-8 w-8 mb-2 opacity-50" />,
          title: message || "No activities",
          subtitle: "",
          titleClass: ""
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
      {content.icon}
      <p className={content.titleClass}>{content.title}</p>
      {content.subtitle && <p className="text-xs mt-1 text-center">{content.subtitle}</p>}
    </div>
  );
};
