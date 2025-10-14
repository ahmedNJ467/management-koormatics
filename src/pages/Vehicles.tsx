import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import FleetVehicles from "@/components/departments/fleet/FleetVehicles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Vehicles() {
  const { domain } = useTenantScope();

  // Only fleet department can access vehicles management
  if (domain !== "fleet") {
  return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Vehicle management is only available to the fleet department.
            </p>
          </CardContent>
        </Card>
        </div>
    );
  }

  return <FleetVehicles />;
}
