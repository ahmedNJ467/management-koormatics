import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import FleetDashboard from "@/components/departments/fleet/FleetDashboard";
import OperationsDashboard from "@/components/departments/operations/OperationsDashboard";
import FinanceDashboard from "@/components/departments/finance/FinanceDashboard";

export default function Dashboard() {
  const { domain } = useTenantScope();

  // Route to appropriate department dashboard based on domain
  // Management uses the main dashboard (no separate management dashboard)
  switch (domain) {
    case "fleet":
      return <FleetDashboard />;
    case "operations":
      return <OperationsDashboard />;
    case "finance":
      return <FinanceDashboard />;
    default:
      // Management and default - use main dashboard content
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Management Dashboard</h1>
          <p className="text-muted-foreground">System administration and management overview.</p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold">System Overview</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Manage users, settings, and system-wide configurations.
              </p>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold">Analytics & Reports</h3>
              <p className="text-sm text-muted-foreground mt-2">
                View comprehensive reports and system analytics.
              </p>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Control user access and permissions across departments.
              </p>
            </div>
          </div>
        </div>
      );
  }
}
