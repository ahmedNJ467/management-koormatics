
import { useState, useEffect } from "react";
import { RecentActivity } from "./RecentActivity";
import { AlertsTab } from "./AlertsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItemProps } from "@/types/dashboard"; 
import { BellRing, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "@/utils/supabase-helpers";

interface RecentActivitiesProps {
  activities?: ActivityItemProps[];
  isLoading?: boolean;
}

export const RecentActivities = ({ activities: propActivities, isLoading: propIsLoading }: RecentActivitiesProps) => {
  const [activeTab, setActiveTab] = useState("activity");
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      if (propActivities) return propActivities;
      
      try {
        // Check connection health first
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          setConnectionError(true);
          return [];
        }
        
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent activities:", error);
          throw error;
        }
        
        setConnectionError(false);
        return data.map(item => ({
          id: item.id,
          title: item.title,
          timestamp: new Date(item.timestamp).toLocaleString(),
          type: item.type,
          icon: item.type
        })) as ActivityItemProps[];
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setConnectionError(true);
        return [];
      }
    },
    enabled: !propActivities,
    retry: 3,
    retryDelay: 1000,
  });

  // Enable realtime for tables if connection is healthy
  useEffect(() => {
    const enableRealtimeTables = async () => {
      try {
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
          // Try to enable realtime, but don't fail if it doesn't work
          try {
            await supabase.rpc('enable_realtime_for_table', { table_name: 'activities' });
          } catch (error) {
            console.log("Realtime not available for activities table:", error);
          }
          
          try {
            await supabase.rpc('enable_realtime_for_table', { table_name: 'alerts' });
          } catch (error) {
            console.log("Realtime not available for alerts table:", error);
          }
        }
      } catch (err) {
        console.log("Realtime setup failed, continuing without realtime features");
      }
    };
    
    enableRealtimeTables();
  }, []);

  const displayActivities = propActivities || activities;
  const loadingState = propIsLoading !== undefined ? propIsLoading : isLoading;

  return (
    <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>Activity</span>
        </TabsTrigger>
        <TabsTrigger value="alerts" className="flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          <span>Alerts</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="activity" className="mt-0">
        <RecentActivity 
          activities={displayActivities} 
          isLoading={loadingState} 
        />
      </TabsContent>
      <TabsContent value="alerts" className="mt-0">
        <AlertsTab />
      </TabsContent>
    </Tabs>
  );
};
