
import { useState, useEffect } from "react";
import { RecentActivity } from "./RecentActivity";
import { AlertsTab } from "./AlertsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItemProps } from "@/types/dashboard"; 
import { BellRing, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivitiesProps {
  activities?: ActivityItemProps[];
  isLoading?: boolean;
}

export const RecentActivities = ({ activities: propActivities, isLoading: propIsLoading }: RecentActivitiesProps) => {
  const [activeTab, setActiveTab] = useState("activity");
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activities"],
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
        type: item.type,
        icon: item.type
      })) as ActivityItemProps[];
    },
    enabled: !propActivities,
  });

  // Enable realtime for this table if it hasn't been already
  useEffect(() => {
    const enableRealtimeSql = async () => {
      await supabase.rpc('enable_realtime_for_table', { table_name: 'activities' });
      await supabase.rpc('enable_realtime_for_table', { table_name: 'alerts' });
    };
    
    enableRealtimeSql().catch(err => {
      console.error("Error enabling realtime:", err);
    });
  }, []);

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
          activities={activities} 
          isLoading={propIsLoading !== undefined ? propIsLoading : isLoading} 
        />
      </TabsContent>
      <TabsContent value="alerts" className="mt-0">
        <AlertsTab />
      </TabsContent>
    </Tabs>
  );
};
