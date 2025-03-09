
import { useState } from "react";
import { RecentActivity } from "./RecentActivity";
import { AlertsTab } from "./AlertsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItemProps } from "@/types/dashboard"; 
import { BellRing, Activity } from "lucide-react";

interface RecentActivitiesProps {
  activities?: ActivityItemProps[];
  isLoading?: boolean;
}

export const RecentActivities = ({ activities, isLoading }: RecentActivitiesProps) => {
  const [activeTab, setActiveTab] = useState("activity");

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
        <RecentActivity activities={activities} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="alerts" className="mt-0">
        <AlertsTab />
      </TabsContent>
    </Tabs>
  );
};
