
import { ActivityItemProps } from "@/types/dashboard";
import { Clock3 } from "lucide-react";
import { ActivityIcon } from "./ActivityIcon";

interface ActivityItemComponentProps {
  activity: ActivityItemProps;
}

// Helper function to format the title to not include long IDs
const formatActivityTitle = (title: string) => {
  // Remove long UUIDs if present
  return title.replace(/\s+[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, '');
};

export const ActivityItem = ({ activity }: ActivityItemComponentProps) => {
  return (
    <div
      key={activity.id}
      className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700 hover:bg-gray-800/60 transition-colors"
    >
      <ActivityIcon type={activity.type} />
      <div className="flex-1">
        <p className="text-sm text-white">{formatActivityTitle(activity.title)}</p>
        <p className="text-xs flex items-center mt-1 text-gray-400">
          <Clock3 className="inline-block h-3 w-3 mr-1 opacity-70" />
          {activity.timestamp}
        </p>
      </div>
    </div>
  );
};
