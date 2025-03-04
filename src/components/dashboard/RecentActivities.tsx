
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Wrench, Car, UserPlus, Building, Fuel } from "lucide-react";
import { ActivityItemProps } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Calendar":
      return <Calendar className="h-4 w-4" />;
    case "Wrench":
      return <Wrench className="h-4 w-4" />;
    case "Car":
      return <Car className="h-4 w-4" />;
    case "UserPlus":
      return <UserPlus className="h-4 w-4" />;
    case "Building":
      return <Building className="h-4 w-4" />;
    case "Fuel":
      return <Fuel className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "trip":
      return "bg-blue-500";
    case "maintenance":
      return "bg-orange-500";
    case "vehicle":
      return "bg-green-500";
    case "driver":
      return "bg-purple-500";
    case "client":
      return "bg-gray-500";
    case "fuel":
      return "bg-amber-500";
    default:
      return "bg-blue-500";
  }
};

interface RecentActivitiesProps {
  activities: ActivityItemProps[];
  isLoading?: boolean;
}

export const RecentActivities = ({ activities, isLoading = false }: RecentActivitiesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest fleet management activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3"
              >
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${getTypeColor(activity.type)} text-white`}>
                  {getIcon(activity.icon)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4">
            No recent activities
          </div>
        )}
      </CardContent>
    </Card>
  );
};
