
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const RecentActivity = ({ 
  activities, 
  isLoading = false 
}: { 
  activities: ActivityItemProps[]; 
  isLoading?: boolean;
}) => {
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-2">
              <div className="h-4 w-[250px] bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-[120px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        <>
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-150">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30 p-2 rounded-full shadow-sm">
                {getIcon(activity.type)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" /> {activity.timestamp}
                </div>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => navigate('/activities')}
          >
            View all activities
          </Button>
        </>
      ) : (
        <div className="text-center py-8 flex flex-col items-center text-muted-foreground">
          <FileText className="h-8 w-8 mb-2 text-muted-foreground/50" />
          <p>No recent activities</p>
        </div>
      )}
    </div>
  );
};
