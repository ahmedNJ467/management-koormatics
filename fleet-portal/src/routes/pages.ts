// Import components first
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Trips from "@/pages/Trips";
import Clients from "@/pages/Clients";
import Maintenance from "@/pages/Maintenance";
import FuelLogs from "@/pages/FuelLogs";
import Reports from "@/pages/Reports";
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
import Chat from "@/pages/Chat";
import InvitationLetter from "@/pages/InvitationLetter";
import VehicleInspections from "@/pages/VehicleInspections";
import VehicleIncidentReports from "@/pages/VehicleIncidentReports";
import VehicleLeasing from "@/pages/VehicleLeasing";
import TripFinance from "@/pages/TripFinance";
import Auth from "@/pages/Auth";
import Forbidden from "@/pages/Forbidden";
import NotFound from "@/pages/NotFound";
import SecurityEscorts from "@/pages/SecurityEscorts";
import Settings from "@/pages/Settings";

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
  Forbidden,
  NotFound,
  SecurityEscorts,
  Settings,
};

// Component mapping for routing (removed to fix Fast Refresh warning)
// export const pathToComponent: Record<string, any> = { ... };
