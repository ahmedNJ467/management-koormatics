"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import AccessGuard from "@/components/auth/AccessGuard";

// Loading component
const LoadingComponent = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Dynamic imports to prevent chunk loading issues
const Dashboard = dynamic(() => import("@/pages/Dashboard"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Vehicles = dynamic(() => import("@/pages/Vehicles"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Drivers = dynamic(() => import("@/pages/Drivers"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Trips = dynamic(() => import("@/pages/Trips"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Clients = dynamic(() => import("@/pages/Clients"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Maintenance = dynamic(() => import("@/pages/Maintenance"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const FuelLogs = dynamic(() => import("@/pages/FuelLogs"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Reports = dynamic(() => import("@/pages/Reports"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Profile = dynamic(() => import("@/pages/Profile"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Quotations = dynamic(() => import("@/pages/Quotations"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Invoices = dynamic(() => import("@/pages/Invoices"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const SpareParts = dynamic(() => import("@/pages/SpareParts"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Contracts = dynamic(() => import("@/pages/Contracts"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Alerts = dynamic(() => import("@/pages/Alerts"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const TripAnalytics = dynamic(() => import("@/pages/TripAnalytics"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const CostAnalytics = dynamic(() => import("@/pages/CostAnalytics"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const CombinedAnalytics = dynamic(() => import("@/pages/CombinedAnalytics"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Dispatch = dynamic(() => import("@/pages/Dispatch"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Chat = dynamic(() => import("@/pages/Chat"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const NotFound = dynamic(() => import("@/pages/NotFound"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const InvitationLetter = dynamic(() => import("@/pages/InvitationLetter"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const VehicleInspections = dynamic(() => import("@/pages/VehicleInspections"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const VehicleIncidentReports = dynamic(
  () => import("@/pages/VehicleIncidentReports"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const VehicleLeasing = dynamic(() => import("@/pages/VehicleLeasing"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const TripFinance = dynamic(() => import("@/pages/TripFinance"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Forbidden = dynamic(() => import("@/pages/Forbidden"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const SecurityEscorts = dynamic(() => import("@/pages/SecurityEscorts"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
const Settings = dynamic(() => import("@/pages/Settings"), {
  ssr: false,
  loading: () => <LoadingComponent />,
});

export default function DynamicPage() {
  const params = useParams();
  const slug = params?.slug as string[] | undefined;
  const path = slug?.join("/") || "";

  // Exclude static file paths from dynamic routing
  if (
    path.startsWith("images/") || 
    path.startsWith("favicon") || 
    path.startsWith("_next/") ||
    path.startsWith("api/") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".jpeg") ||
    path.includes(".gif") ||
    path.includes(".svg") ||
    path.includes(".ico") ||
    path.includes(".webp") ||
    path.includes(".css") ||
    path.includes(".js") ||
    path.includes(".json")
  ) {
    return null; // Let Next.js handle static files
  }

  // Route mapping based on the original App.tsx
  const routeMap: Record<string, React.ComponentType> = {
    dashboard: Dashboard,
    vehicles: Vehicles,
    drivers: Drivers,
    trips: Trips,
    clients: Clients,
    maintenance: Maintenance,
    "fuel-logs": FuelLogs,
    reports: Reports,
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
    chat: Chat,
    "security-escorts": SecurityEscorts,
    "invitation-letter": InvitationLetter,
    "vehicle-inspections": VehicleInspections,
    "vehicle-incident-reports": VehicleIncidentReports,
    "vehicle-leasing": VehicleLeasing,
    "trip-finance": TripFinance,
    settings: Settings,
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