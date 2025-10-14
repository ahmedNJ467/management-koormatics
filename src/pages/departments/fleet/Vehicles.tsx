import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, Wrench, Fuel } from "lucide-react";

export default function FleetVehicles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleet Vehicles</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>Fleet Department</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Vehicle #V001</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Toyota Camry 2023</p>
              <p className="text-sm">
                Status: <span className="text-green-600">Available</span>
              </p>
              <p className="text-sm">Driver: John Smith</p>
              <p className="text-sm">Mileage: 15,230 km</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Vehicle #V002</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Honda Accord 2022</p>
              <p className="text-sm">
                Status: <span className="text-blue-600">In Use</span>
              </p>
              <p className="text-sm">Driver: Sarah Johnson</p>
              <p className="text-sm">Mileage: 28,450 km</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Vehicle #V003</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ford Transit 2023</p>
              <p className="text-sm">
                Status: <span className="text-yellow-600">Maintenance</span>
              </p>
              <p className="text-sm">Driver: -</p>
              <p className="text-sm">Mileage: 12,890 km</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
