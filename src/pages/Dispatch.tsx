import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import OperationsDispatch from "@/components/departments/operations/OperationsDispatch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Dispatch() {
  const { domain } = useTenantScope();

  // Only operations department can access dispatch
  if (domain !== "operations") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Dispatch center is only available to the operations department.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OperationsDispatch />;
}
