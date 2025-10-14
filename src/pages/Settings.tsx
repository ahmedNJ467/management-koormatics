import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import ManagementSettings from "@/components/departments/management/ManagementSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Settings() {
  const { domain } = useTenantScope();

  // Only management department can access settings
  if (domain !== "management") {
  return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
              </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              System settings are only available to the management department.
            </p>
              </CardContent>
            </Card>
          </div>
    );
  }

  return <ManagementSettings />;
}
