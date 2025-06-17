
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { ActivityLoading } from "./recent-activity/ActivityLoading";
import { ActivityEmptyState } from "./recent-activity/ActivityEmptyState";
import { ActivityItem } from "./recent-activity/ActivityItem";
import { useRealtimeActivities } from "./recent-activity/useRealtimeActivities";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: ActivityItemProps[];
}

export const RecentActivity = ({ activities: propActivities, isLoading: propIsLoading }: RecentActivityProps) => {
  const { data: fetchedActivities, isLoading, error } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      if (propActivities) return propActivities;
      
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching activities:", error);
          throw error;
        }
        
        return data.map(item => ({
          id: item.id?.toString() || 'unknown',
          title: item.title || 'Unknown activity',
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time',
          type: (item.type as ActivityItemProps['type']) || 'default',
          icon: item.type || 'default',
          related_id: item.related_id // Keep the actual related trip ID for reference
        })) as ActivityItemProps[];
      } catch (err) {
        console.error("Database connection error:", err);
        return [];
      }
    },
    enabled: !propActivities,
    retry: 3,
    retryDelay: 1000,
  });

  const { realtimeActivities, connectionError } = useRealtimeActivities(fetchedActivities);

  const loadingState = propIsLoading !== undefined ? propIsLoading : isLoading;
  const displayActivities = propActivities || realtimeActivities;

  if (loadingState) {
    return <ActivityLoading />;
  }

  if (connectionError) {
    return <ActivityEmptyState type="connection-error" />;
  }

  if (error) {
    return <ActivityEmptyState type="error" />;
  }

  if (!displayActivities || displayActivities.length === 0) {
    return <ActivityEmptyState type="empty" />;
  }

  // Filter out any invalid activities before rendering
  const validActivities = displayActivities.filter(activity => 
    activity && typeof activity === 'object' && activity.id
  );

  if (validActivities.length === 0) {
    return <ActivityEmptyState type="empty" />;
  }

  return (
    <ScrollArea className="h-[400px] w-full">
      <div className="space-y-3 pr-4">
        {validActivities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  );
};
