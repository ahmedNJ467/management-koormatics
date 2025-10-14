import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Wrench,
  Fuel,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function FleetVehicles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleet Vehicles</h1>
        <div className="text-sm text-muted-foreground">
          Vehicle management and tracking
        </div>
      </div>

      {/* Vehicle Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">144</div>
            <p className="text-xs text-muted-foreground">Available for trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Service</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Management Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Manage vehicle fleet, assignments, and status.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                View All Vehicles
              </button>
              <button className="px-3 py-1 border border-border rounded-md text-sm">
                Add Vehicle
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inspections & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Schedule inspections and manage incident reports.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                Vehicle Inspections
              </button>
              <button className="px-3 py-1 border border-border rounded-md text-sm">
                Incident Reports
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vehicle Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Vehicle Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Vehicle #V-001 completed trip to Airport</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-yellow-500" />
              <span>Vehicle #V-045 scheduled for maintenance</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Vehicle #V-078 reported low fuel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
