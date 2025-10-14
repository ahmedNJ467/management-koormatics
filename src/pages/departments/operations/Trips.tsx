import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Users, Car } from "lucide-react";

export default function OperationsTrips() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Operations Trips</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Operations Department</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Trip #T001</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Airport Transfer</p>
              <p className="text-sm">
                Status: <span className="text-green-600">Completed</span>
              </p>
              <p className="text-sm">Driver: John Smith</p>
              <p className="text-sm">Vehicle: #V001</p>
              <p className="text-sm">Duration: 45 min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Trip #T002</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">City Tour</p>
              <p className="text-sm">
                Status: <span className="text-blue-600">In Progress</span>
              </p>
              <p className="text-sm">Driver: Sarah Johnson</p>
              <p className="text-sm">Vehicle: #V002</p>
              <p className="text-sm">Duration: 2h 30min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Trip #T003</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Corporate Event</p>
              <p className="text-sm">
                Status: <span className="text-yellow-600">Scheduled</span>
              </p>
              <p className="text-sm">Driver: Mike Wilson</p>
              <p className="text-sm">Vehicle: #V003</p>
              <p className="text-sm">Duration: 4h 00min</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
