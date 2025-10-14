"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import AccessGuard from "@/components/auth/AccessGuard";
import { useTenantScope } from "@/hooks/use-tenant-scope";

// Loading component
const LoadingComponent = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Dynamic imports for department-specific components
const ManagementDashboard = dynamic(
  () => import("@/pages/departments/management/Dashboard"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const FleetDashboard = dynamic(
  () => import("@/pages/departments/fleet/Dashboard"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const OperationsDashboard = dynamic(
  () => import("@/pages/departments/operations/Dashboard"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const FinanceDashboard = dynamic(
  () => import("@/pages/departments/finance/Dashboard"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);

// Department-specific page components
const FleetVehicles = dynamic(
  () => import("@/pages/departments/fleet/Vehicles"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const FleetDrivers = dynamic(
  () => import("@/pages/departments/fleet/Drivers"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const OperationsTrips = dynamic(
  () => import("@/pages/departments/operations/Trips"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const OperationsDispatch = dynamic(
  () => import("@/pages/departments/operations/Dispatch"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const FinanceInvoices = dynamic(
  () => import("@/pages/departments/finance/Invoices"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const FinanceReports = dynamic(
  () => import("@/pages/departments/finance/Reports"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
const ManagementSettings = dynamic(
  () => import("@/pages/departments/management/Settings"),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);
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
  const { domain } = useTenantScope();

  // Get department-specific component based on domain and path
  const getDepartmentComponent = (path: string) => {
    switch (domain) {
      case "management":
        if (path === "dashboard") return ManagementDashboard;
        if (path === "settings") return ManagementSettings;
        break;
      case "fleet":
        if (path === "dashboard") return FleetDashboard;
        if (path === "vehicles") return FleetVehicles;
        if (path === "drivers") return FleetDrivers;
        break;
      case "operations":
        if (path === "dashboard") return OperationsDashboard;
        if (path === "trips") return OperationsTrips;
        if (path === "dispatch") return OperationsDispatch;
        break;
      case "finance":
        if (path === "dashboard") return FinanceDashboard;
        if (path === "invoices") return FinanceInvoices;
        if (path === "reports") return FinanceReports;
        break;
    }
    return null;
  };

  // Fallback route mapping for non-department-specific pages
  const routeMap: Record<string, React.ComponentType> = {
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

  // Try to get department-specific component first
  const DepartmentComponent = getDepartmentComponent(path);
  const Component = DepartmentComponent || routeMap[path];

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
