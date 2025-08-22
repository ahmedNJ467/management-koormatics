"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Clock, User, Car, Wrench } from "lucide-react";
import { ActivityItemProps } from "@/types/dashboard";

interface RecentActivityProps {
  activities?: ActivityItemProps[];
  isLoading?: boolean;
}

// Mock activities for fallback
const mockActivities: ActivityItemProps[] = [
  {
    id: "1",
    type: "trip",
    title: "Trip Completed",
    timestamp: new Date().toISOString(),
    icon: "trip",
  },
  {
    id: "2",
    type: "maintenance",
    title: "Maintenance Scheduled",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    icon: "maintenance",
  },
  {
    id: "3",
    type: "driver",
    title: "Driver Added",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    icon: "driver",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "trip":
      return <Car className="h-4 w-4" />;
    case "maintenance":
      return <Wrench className="h-4 w-4" />;
    case "driver":
      return <User className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityBadgeColor = (type: string) => {
  switch (type) {
    case "trip":
      return "bg-blue-100 text-blue-800";
    case "maintenance":
      return "bg-orange-100 text-orange-800";
    case "driver":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function RecentActivity({
  activities = mockActivities,
  isLoading = false,
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={activity.title} />
                  <AvatarFallback>
                    {activity.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <p className="text-sm font-medium">{activity.title}</p>
                    <Badge
                      variant="outline"
                      className={getActivityBadgeColor(activity.type)}
                    >
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
