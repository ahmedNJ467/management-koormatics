
import { ActivityIcon } from "./ActivityIcon";
import { ActivityItemProps } from "@/types/dashboard";

interface ActivityItemComponentProps {
  activity: ActivityItemProps;
}

export const ActivityItem = ({ activity }: ActivityItemComponentProps) => {
  if (!activity || !activity.id) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 rounded-lg border border-border bg-card p-4">
      <ActivityIcon type={activity.type} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-card-foreground truncate">
          {activity.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {activity.timestamp}
        </div>
      </div>
    </div>
  );
};
