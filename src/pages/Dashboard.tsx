import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import ManagementDashboard from "@/components/departments/management/ManagementDashboard";
import FleetDashboard from "@/components/departments/fleet/FleetDashboard";
import OperationsDashboard from "@/components/departments/operations/OperationsDashboard";
import FinanceDashboard from "@/components/departments/finance/FinanceDashboard";

export default function Dashboard() {
  const { domain } = useTenantScope();

  // Route to appropriate department dashboard based on domain
  switch (domain) {
    case "management":
      return <ManagementDashboard />;
    case "fleet":
      return <FleetDashboard />;
    case "operations":
      return <OperationsDashboard />;
    case "finance":
      return <FinanceDashboard />;
    default:
      return <ManagementDashboard />;
  }
}
