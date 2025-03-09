
import { useState, useEffect } from "react";
import { RecentActivity } from "./RecentActivity";
import { AlertsTab } from "./AlertsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActivities } from "@/utils/activity-logger";
import { ActivityItemProps } from "@/types/dashboard"; 
import { BellRing, Activity } from "lucide-react";

export const RecentActivities = () => {
  const [activeTab, setActiveTab] = useState("activity");
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>([]);

  useEffect(() => {
    setRecentActivities(getActivities(5));
    
    const intervalId = setInterval(() => {
      setRecentActivities(getActivities(5));
    }, 15000);
    
    return () => clearInterval(intervalId);
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
        <RecentActivity activities={recentActivities} isLoading={false} />
      </TabsContent>
      <TabsContent value="alerts" className="mt-0">
        <AlertsTab />
      </TabsContent>
    </Tabs>
  );
};
