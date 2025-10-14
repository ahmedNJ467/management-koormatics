import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Clock, CheckCircle } from "lucide-react";

export default function FleetDrivers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleet Drivers</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Fleet Department</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>John Smith</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Driver ID: D001</p>
              <p className="text-sm">
                Status: <span className="text-green-600">Active</span>
              </p>
              <p className="text-sm">Vehicle: #V001</p>
              <p className="text-sm">License: ABC123456</p>
              <p className="text-sm">Experience: 5 years</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Sarah Johnson</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Driver ID: D002</p>
              <p className="text-sm">
                Status: <span className="text-blue-600">On Trip</span>
              </p>
              <p className="text-sm">Vehicle: #V002</p>
              <p className="text-sm">License: DEF789012</p>
              <p className="text-sm">Experience: 3 years</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Mike Wilson</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Driver ID: D003</p>
              <p className="text-sm">
                Status: <span className="text-yellow-600">On Leave</span>
              </p>
              <p className="text-sm">Vehicle: -</p>
              <p className="text-sm">License: GHI345678</p>
              <p className="text-sm">Experience: 7 years</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
