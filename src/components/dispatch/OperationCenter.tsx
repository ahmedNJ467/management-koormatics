import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageCircle,
  Navigation,
  Shield,
  User,
  Car,
  Bell,
  RefreshCw,
} from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { format } from "date-fns";

interface OperationCenterProps {
  trips: DisplayTrip[];
  onRefresh: () => void;
}

export function OperationCenter({ trips, onRefresh }: OperationCenterProps) {
  const [selectedTrip, setSelectedTrip] = useState<DisplayTrip | null>(null);

  // Real-time activity feed
  const activities = [
    {
      id: 1,
      type: "trip_started",
      message: "Trip #A1B2C3 started - Driver: John Doe",
      time: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      priority: "normal" as const,
      icon: Activity,
    },
    {
      id: 2,
      type: "delay_alert",
      message: "Trip #D4E5F6 delayed by 15 minutes",
      time: new Date(Date.now() - 12 * 60000), // 12 minutes ago
      priority: "warning" as const,
      icon: AlertTriangle,
    },
    {
      id: 3,
      type: "trip_completed",
      message: "Trip #G7H8I9 completed successfully",
      time: new Date(Date.now() - 18 * 60000), // 18 minutes ago
      priority: "success" as const,
      icon: CheckCircle,
    },
    {
      id: 4,
      type: "emergency_alert",
      message: "Emergency escort requested for Trip #J1K2L3",
      time: new Date(Date.now() - 25 * 60000), // 25 minutes ago
      priority: "urgent" as const,
      icon: Shield,
    },
    {
      id: 5,
      type: "driver_check_in",
      message: "Driver Mike Smith checked in at airport",
      time: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      priority: "normal" as const,
      icon: User,
    },
  ];

  // Active communications
  const communications = [
    {
      id: 1,
      type: "incoming_call",
      from: "Driver Ahmed Ali",
      message: "Requesting route assistance",
      time: new Date(Date.now() - 2 * 60000),
      unread: true,
    },
    {
      id: 2,
      type: "message",
      from: "Client Services",
      message: "VIP client arrival update needed",
      time: new Date(Date.now() - 8 * 60000),
      unread: true,
    },
    {
      id: 3,
      type: "system_alert",
      from: "System",
      message: "Vehicle maintenance reminder",
      time: new Date(Date.now() - 15 * 60000),
      unread: false,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
      case "success":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      default:
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time Activity Feed */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Activity Feed
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {activities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg border ${getPriorityBg(activity.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-4 w-4 mt-0.5 ${getPriorityColor(activity.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(activity.time, "HH:mm")} - {format(activity.time, "MMM d")}
                        </p>
                      </div>
                      <Badge
                        variant={activity.priority === "urgent" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {activity.priority}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Communications Center */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Communications
            <Badge variant="secondary" className="ml-auto">
              {communications.filter(c => c.unread).length} unread
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    comm.unread ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {comm.type === "incoming_call" ? (
                        <Phone className="h-4 w-4 text-green-500" />
                      ) : comm.type === "message" ? (
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Bell className="h-4 w-4 text-amber-500" />
                      )}
                      {comm.unread && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-card-foreground">
                          {comm.from}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(comm.time, "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {comm.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}