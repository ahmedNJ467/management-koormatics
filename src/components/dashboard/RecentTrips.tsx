"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, Eye } from "lucide-react";

interface Trip {
  id: string;
  clientName: string;
  destination: string;
  status: "completed" | "in_progress" | "scheduled" | "cancelled";
  startTime: string;
  endTime?: string;
  driver: string;
  vehicle: string;
}

interface RecentTripsProps {
  trips?: Trip[];
}

const getStatusColor = (status: Trip["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "scheduled":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatTime = (timeString: string) => {
  if (!timeString) return "N/A";
  try {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
};

export default function RecentTrips({ trips = [] }: RecentTripsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Recent Trips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{trip.clientName}</h4>
                    <Badge
                      variant="outline"
                      className={getStatusColor(trip.status)}
                    >
                      {trip.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(trip.startTime)}</span>
                      {trip.endTime && (
                        <span> - {formatTime(trip.endTime)}</span>
                      )}
                    </div>
                    <span>Driver: {trip.driver}</span>
                    <span>Vehicle: {trip.vehicle}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {trips.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent trips</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
