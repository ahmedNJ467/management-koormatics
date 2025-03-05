
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string | number;
  title: string;
  timestamp: string;
  type: string;
}

interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
}

export const RecentActivity = ({ activities, isLoading = false }: RecentActivityProps) => {
  return (
    <ScrollArea className="h-[300px] w-full pr-4">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 rounded-lg border p-3"
            >
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No recent activities
        </div>
      )}
    </ScrollArea>
  );
};
