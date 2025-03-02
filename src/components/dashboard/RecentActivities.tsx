
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, Car, Building, Wrench, UserPlus, Fuel } from "lucide-react";
import { ActivityItemProps } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

interface RecentActivitiesProps {
  activities: ActivityItemProps[];
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  // Map of activity types to their respective colors
  const typeColors: Record<string, string> = {
    trip: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    vehicle: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    driver: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    client: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    fuel: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  };

  // Function to render the appropriate icon based on activity type
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Calendar": return <Calendar className="h-4 w-4" />;
      case "Car": return <Car className="h-4 w-4" />;
      case "Building": return <Building className="h-4 w-4" />;
      case "Wrench": return <Wrench className="h-4 w-4" />;
      case "UserPlus": return <UserPlus className="h-4 w-4" />;
      case "Fuel": return <Fuel className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          Recent Activities
        </CardTitle>
        <CardDescription>
          The latest activities across the fleet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                {renderIcon(activity.icon)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge variant="outline" className={typeColors[activity.type]}>
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
