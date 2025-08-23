import { Badge } from "@/components/ui/badge";
import { Check, Clock, Calendar, AlertTriangle } from "lucide-react";
import type { MaintenanceStatus } from "@/lib/types/maintenance";

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
}

const statusStyles: Record<MaintenanceStatus, string> = {
  completed:
    "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400 border-green-200 dark:border-green-800/30",
  in_progress:
    "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
  scheduled:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400 border-red-200 dark:border-red-800/30",
};

const statusLabels: Record<MaintenanceStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
};

const statusIcons: Record<MaintenanceStatus, JSX.Element> = {
  completed: <Check className="w-3 h-3 mr-1" />,
  in_progress: <Clock className="w-3 h-3 mr-1" />,
  scheduled: <Calendar className="w-3 h-3 mr-1" />,
  cancelled: <AlertTriangle className="w-3 h-3 mr-1" />,
};

export function MaintenanceStatusBadge({
  status,
}: MaintenanceStatusBadgeProps) {
  return (
    <Badge className={`${statusStyles[status]} font-medium`} variant="outline">
      {statusIcons[status]}
      {statusLabels[status]}
    </Badge>
  );
}
