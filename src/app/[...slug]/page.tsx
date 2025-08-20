"use client";

import { useParams } from "next/navigation";
import Layout from "@/components/Layout";
import {
  Dashboard,
  Vehicles,
  Drivers,
  Trips,
  Clients,
  Maintenance,
  FuelLogs,
  Reports,
  Settings,
  Profile,
  Quotations,
  Invoices,
  SpareParts,
  Contracts,
  Alerts,
  TripAnalytics,
  CostAnalytics,
  CombinedAnalytics,
  Dispatch,
  NotFound,
  InvitationLetter,
  VehicleInspections,
  VehicleIncidentReports,
  VehicleLeasing,
  TripFinance,
  SettingsSecurity,
  Forbidden,
  SecurityEscorts,
} from "@/routes/pages";
import AccessGuard from "@/components/auth/AccessGuard";

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string[];
  const path = slug?.join("/") || "";

  // Route mapping based on the original App.tsx
  const routeMap: Record<string, React.ComponentType> = {
    "dashboard-management": Dashboard,
    "dashboard-fleet": Dashboard,
    "dashboard-ops": Dashboard,
    "dashboard-finance": Dashboard,
    dashboard: Dashboard,
    vehicles: Vehicles,
    drivers: Drivers,
    trips: Trips,
    clients: Clients,
    maintenance: Maintenance,
    "fuel-logs": FuelLogs,
    reports: Reports,
    settings: Settings,
    profile: Profile,
    quotations: Quotations,
    invoices: Invoices,
    "spare-parts": SpareParts,
    contracts: Contracts,
    alerts: Alerts,
    "trip-analytics": TripAnalytics,
    "cost-analytics": CostAnalytics,
    "combined-analytics": CombinedAnalytics,
    dispatch: Dispatch,
    "security-escorts": SecurityEscorts,
    "invitation-letter": InvitationLetter,
    "vehicle-inspections": VehicleInspections,
    "vehicle-incident-reports": VehicleIncidentReports,
    "vehicle-leasing": VehicleLeasing,
    "trip-finance": TripFinance,
    "403": Forbidden,
  };

  const Component = routeMap[path];

  if (!Component) {
    return <NotFound />;
  }

  return (
    <Layout>
      <AccessGuard pageId={path}>
        <Component />
      </AccessGuard>
    </Layout>
  );
}
