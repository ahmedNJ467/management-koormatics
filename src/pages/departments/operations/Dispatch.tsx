import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Clock, Shield } from "lucide-react";

export default function OperationsDispatch() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Operations Dispatch</h1>
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
              <span>Dispatch #D001</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Airport Pickup</p>
              <p className="text-sm">
                Status: <span className="text-green-600">Assigned</span>
              </p>
              <p className="text-sm">Driver: John Smith</p>
              <p className="text-sm">Vehicle: #V001</p>
              <p className="text-sm">ETA: 15 min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Dispatch #D002</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">City Transfer</p>
              <p className="text-sm">
                Status: <span className="text-blue-600">In Progress</span>
              </p>
              <p className="text-sm">Driver: Sarah Johnson</p>
              <p className="text-sm">Vehicle: #V002</p>
              <p className="text-sm">ETA: 25 min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Dispatch #D003</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Security Escort</p>
              <p className="text-sm">
                Status: <span className="text-yellow-600">Pending</span>
              </p>
              <p className="text-sm">Driver: -</p>
              <p className="text-sm">Vehicle: -</p>
              <p className="text-sm">ETA: -</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
