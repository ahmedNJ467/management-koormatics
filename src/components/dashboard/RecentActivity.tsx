
import { 
  Car, 
  Calendar, 
  Wrench, 
  UserPlus, 
  Fuel, 
  Building, 
  CheckCircle,
  FileText,
  Clock,
  FileBadge
} from "lucide-react";
import { ActivityItemProps } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getActivities } from "@/utils/activity-logger";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: ActivityItemProps[];
}

export const RecentActivity = ({ isLoading = false, activities }: RecentActivityProps) => {
  const [activityItems, setActivityItems] = useState<ActivityItemProps[]>([]);

  // Query for recent activities
  const { data: databaseActivities, refetch } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data?.map(activity => ({
        id: activity.id,
        title: activity.title,
        timestamp: formatTimestamp(new Date(activity.timestamp)),
        type: activity.type,
        icon: activity.type
      })) as ActivityItemProps[];
    },
    enabled: !activities || activities.length === 0
  });
  
  useEffect(() => {
    // If activities are provided, use them; otherwise get from activity logger
    if (activities && activities.length > 0) {
      setActivityItems(activities);
    } else if (databaseActivities && databaseActivities.length > 0) {
      setActivityItems(databaseActivities);
    } else {
      // As a fallback, use in-memory activities
      setActivityItems(getActivities(5));
    }
  }, [activities, databaseActivities]);

  // Function to get the appropriate icon for each activity type
  const getIcon = (type: string) => {
    switch (type) {
      case "trip":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "maintenance":
        return <Wrench className="h-5 w-5 text-amber-500" />;
      case "vehicle":
        return <Car className="h-5 w-5 text-purple-500" />;
      case "driver":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "client":
        return <Building className="h-5 w-5 text-indigo-500" />;
      case "fuel":
        return <Fuel className="h-5 w-5 text-red-500" />;
      case "contract":
        return <FileBadge className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format timestamps in a human-readable format
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      {activityItems.length > 0 ? (
        <>
          {activityItems.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-150">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                {getIcon(activity.type)}
              </div>
              <div className="space-y-1">
                <p className="text-sm">{activity.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" /> {activity.timestamp}
                </div>
              </div>
            </div>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p>No recent activities</p>
        </div>
      )}
    </div>
  );
};
