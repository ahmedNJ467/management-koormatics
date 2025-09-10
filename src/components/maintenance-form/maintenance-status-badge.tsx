import { Badge } from "@/components/ui/badge";
import { Check, Clock, Calendar, AlertTriangle } from "lucide-react";
import type { MaintenanceStatus } from "@/lib/types/maintenance";

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
}

const statusStyles: Record<MaintenanceStatus, string> = {
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  scheduled: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-600 border-red-500/30",
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
