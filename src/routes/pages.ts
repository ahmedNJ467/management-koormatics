import type { PreloadableComponent } from "@/utils/lazyWithPreload";
import { lazyWithPreload } from "@/utils/lazyWithPreload";

export const Dashboard = lazyWithPreload(() => import("@/pages/Dashboard"));
export const Vehicles = lazyWithPreload(() => import("@/pages/Vehicles"));
export const Drivers = lazyWithPreload(() => import("@/pages/Drivers"));
export const Trips = lazyWithPreload(() => import("@/pages/Trips"));
export const Clients = lazyWithPreload(() => import("@/pages/Clients"));
export const Maintenance = lazyWithPreload(() => import("@/pages/Maintenance"));
export const FuelLogs = lazyWithPreload(() => import("@/pages/FuelLogs"));
export const Reports = lazyWithPreload(() => import("@/pages/Reports"));
export const Settings = lazyWithPreload(() => import("@/pages/Settings"));
export const Profile = lazyWithPreload(() => import("@/pages/Profile"));
export const Quotations = lazyWithPreload(() => import("@/pages/Quotations"));
export const Invoices = lazyWithPreload(() => import("@/pages/Invoices"));
export const SpareParts = lazyWithPreload(() => import("@/pages/SpareParts"));
export const Contracts = lazyWithPreload(() => import("@/pages/Contracts"));
export const Alerts = lazyWithPreload(() => import("@/pages/Alerts"));
export const TripAnalytics = lazyWithPreload(
  () => import("@/pages/TripAnalytics")
);
export const CostAnalytics = lazyWithPreload(
  () => import("@/pages/CostAnalytics")
);
export const CombinedAnalytics = lazyWithPreload(
  () => import("@/pages/CombinedAnalytics")
);
export const Dispatch = lazyWithPreload(() => import("@/pages/Dispatch"));
export const InvitationLetter = lazyWithPreload(
  () => import("@/pages/InvitationLetter")
);
export const VehicleInspections = lazyWithPreload(
  () => import("@/pages/VehicleInspections")
);
export const VehicleIncidentReports = lazyWithPreload(
  () => import("@/pages/VehicleIncidentReports")
);
export const VehicleLeasing = lazyWithPreload(
  () => import("@/pages/VehicleLeasing")
);
export const TripFinance = lazyWithPreload(() => import("@/pages/TripFinance"));
export const Auth = lazyWithPreload(() => import("@/pages/Auth"));
export const SettingsSecurity = lazyWithPreload(
  () => import("@/pages/SettingsSecurity")
);
export const Forbidden = lazyWithPreload(() => import("@/pages/Forbidden"));
export const NotFound = lazyWithPreload(() => import("@/pages/NotFound"));

export const pathToComponent: Record<string, PreloadableComponent<any>> = {
  "/dashboard-management": Dashboard,
  "/dashboard-fleet": Dashboard,
  "/dashboard-ops": Dashboard,
  "/dashboard-finance": Dashboard,
  "/dashboard": Dashboard,
  "/vehicles": Vehicles,
  "/drivers": Drivers,
  "/trips": Trips,
  "/clients": Clients,
  "/maintenance": Maintenance,
  "/fuel-logs": FuelLogs,
  "/reports": Reports,
  "/settings": Settings,
  "/settings/security": SettingsSecurity,
  "/profile": Profile,
  "/quotations": Quotations,
  "/invoices": Invoices,
  "/spare-parts": SpareParts,
  "/contracts": Contracts,
  "/alerts": Alerts,
  "/trip-analytics": TripAnalytics,
  "/cost-analytics": CostAnalytics,
  "/combined-analytics": CombinedAnalytics,
  "/dispatch": Dispatch,
  "/invitation-letter": InvitationLetter,
  "/vehicle-inspections": VehicleInspections,
  "/vehicle-incident-reports": VehicleIncidentReports,
  "/vehicle-leasing": VehicleLeasing,
  "/trip-finance": TripFinance,
};

export function preloadByPath(path: string) {
  const component = pathToComponent[path];
  if (component && typeof (component as any).preload === "function") {
    component.preload();
  }
}
