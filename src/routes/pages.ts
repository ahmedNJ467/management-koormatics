// Import components first
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Trips from "@/pages/Trips";
import Clients from "@/pages/Clients";
import Maintenance from "@/pages/Maintenance";
import FuelLogs from "@/pages/FuelLogs";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Quotations from "@/pages/Quotations";
import Invoices from "@/pages/Invoices";
import SpareParts from "@/pages/SpareParts";
import Contracts from "@/pages/Contracts";
import Alerts from "@/pages/Alerts";
import TripAnalytics from "@/pages/TripAnalytics";
import CostAnalytics from "@/pages/CostAnalytics";
import CombinedAnalytics from "@/pages/CombinedAnalytics";
import Dispatch from "@/pages/Dispatch";
import InvitationLetter from "@/pages/InvitationLetter";
import VehicleInspections from "@/pages/VehicleInspections";
import VehicleIncidentReports from "@/pages/VehicleIncidentReports";
import VehicleLeasing from "@/pages/VehicleLeasing";
import TripFinance from "@/pages/TripFinance";
import Auth from "@/pages/Auth";
import SettingsSecurity from "@/pages/SettingsSecurity";
import Forbidden from "@/pages/Forbidden";
import NotFound from "@/pages/NotFound";
import SecurityEscorts from "@/pages/SecurityEscorts";

// Re-export components for external use
export {
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
  InvitationLetter,
  VehicleInspections,
  VehicleIncidentReports,
  VehicleLeasing,
  TripFinance,
  Auth,
  SettingsSecurity,
  Forbidden,
  NotFound,
  SecurityEscorts,
};

// Component mapping for routing
export const pathToComponent: Record<string, any> = {
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
  "/security-escorts": SecurityEscorts,
  "/invitation-letter": InvitationLetter,
  "/vehicle-inspections": VehicleInspections,
  "/vehicle-incident-reports": VehicleIncidentReports,
  "/vehicle-leasing": VehicleLeasing,
  "/trip-finance": TripFinance,
};
