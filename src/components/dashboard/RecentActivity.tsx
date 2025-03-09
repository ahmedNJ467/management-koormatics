
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { Calendar, Clock, User, Car, Building, Activity, Clock3, Fuel, FileCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { enableRealtimeForTable } from "@/utils/supabase-helpers";

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: ActivityItemProps[];
}

export const RecentActivity = ({ activities: propActivities, isLoading: propIsLoading }: RecentActivityProps) => {
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItemProps[]>([]);

  // Setup realtime for activities table
  useEffect(() => {
    // Enable realtime for activities table
    const setupRealtime = async () => {
      try {
        await enableRealtimeForTable('activities');
      } catch (error) {
        console.error("Failed to enable realtime for activities:", error);
      }
    };
    
    setupRealtime();
  }, []);

  const { data: fetchedActivities, isLoading } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      if (propActivities) return propActivities;
      
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        title: item.title,
        timestamp: new Date(item.timestamp).toLocaleString(),
        type: item.type as ActivityItemProps['type'],
        icon: item.type
      })) as ActivityItemProps[];
    },
    enabled: !propActivities,
  });

  // Set up realtime subscription
  useEffect(() => {
    const activities = fetchedActivities || [];
    setRealtimeActivities(activities);

    const channel = supabase
      .channel('public:activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities'
      }, async (payload) => {
        console.log('Realtime activity update:', payload);
        
        // Refresh activities when there's a change
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(5);
        
        if (!error && data) {
          const formattedActivities = data.map(item => ({
            id: item.id,
            title: item.title,
            timestamp: new Date(item.timestamp).toLocaleString(),
            type: item.type as ActivityItemProps['type'],
            icon: item.type
          })) as ActivityItemProps[];
          
          setRealtimeActivities(formattedActivities);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchedActivities]);

  const loadingState = propIsLoading !== undefined ? propIsLoading : isLoading;
  const displayActivities = propActivities || realtimeActivities;

  if (loadingState) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p>No recent activities</p>
        <p className="text-xs mt-1">Check back later for updates</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trip':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-indigo-500" />;
      case 'driver':
        return <User className="h-5 w-5 text-green-500" />;
      case 'vehicle':
        return <Car className="h-5 w-5 text-amber-500" />;
      case 'fuel':
        return <Fuel className="h-5 w-5 text-red-500" />;
      case 'contract':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case 'client':
        return <Building className="h-5 w-5 text-pink-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700 hover:bg-gray-800/60 transition-colors"
        >
          <div className="text-blue-400 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm text-white">{activity.title}</p>
            <p className="text-xs flex items-center mt-1 text-gray-400">
              <Clock3 className="inline-block h-3 w-3 mr-1 opacity-70" />
              {activity.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
