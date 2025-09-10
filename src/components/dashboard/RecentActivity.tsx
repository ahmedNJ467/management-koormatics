"use client";

import React from "react";
import { Activity, User, Car, Wrench } from "lucide-react";
import { ActivityItemProps } from "@/types/dashboard";
import { getRelativeTime } from "@/utils/date-utils";

interface RecentActivityProps {
  activities?: ActivityItemProps[];
  isLoading?: boolean;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "trip":
      return <Car className="h-3 w-3 text-blue-500" />;
    case "maintenance":
      return <Wrench className="h-3 w-3 text-orange-500" />;
    case "driver":
      return <User className="h-3 w-3 text-green-500" />;
    default:
      return <Activity className="h-3 w-3 text-gray-500" />;
  }
};

export function RecentActivity({
  activities = [],
  isLoading = false,
}: RecentActivityProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-3 w-3 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
