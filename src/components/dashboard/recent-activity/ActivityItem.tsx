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
    <div className="grid grid-cols-[auto,1fr,auto] items-start gap-3 rounded-md border p-3">
      <div className="mt-0.5">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground whitespace-normal break-words">
          {activity.title}
        </div>
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
        {activity.timestamp}
      </div>
    </div>
  );
};
