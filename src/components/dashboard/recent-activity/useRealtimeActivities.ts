
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
import { enableRealtimeForTable, checkSupabaseConnection } from "@/utils/supabase-helpers";

export const useRealtimeActivities = (fetchedActivities?: ActivityItemProps[]) => {
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItemProps[]>([]);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  // Setup realtime for activities table
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        // Check connection health first
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          setConnectionError(true);
          return;
        }
        
        await enableRealtimeForTable('activities');
        setConnectionError(false);
      } catch (error) {
        console.error("Failed to enable realtime for activities:", error);
        setConnectionError(true);
      }
    };
    
    setupRealtime();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (connectionError) return;
    
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
        
        try {
          // Refresh activities when there's a change
          const { data, error } = await supabase
            .from("activities")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(5);
          
          if (!error && data) {
            const formattedActivities = data.map(item => ({
              id: item.id.toString(),
              title: item.title,
              timestamp: new Date(item.timestamp).toLocaleString(),
              type: item.type as ActivityItemProps['type'],
              icon: item.type
            })) as ActivityItemProps[];
            
            setRealtimeActivities(formattedActivities);
          }
        } catch (err) {
          console.error("Error refreshing activities:", err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchedActivities, connectionError]);

  return {
    realtimeActivities,
    connectionError,
    setConnectionError
  };
};
