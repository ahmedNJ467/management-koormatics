import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Clients from "./pages/Clients";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Quotations from "./pages/Quotations";
import Invoices from "./pages/Invoices";
import SpareParts from "./pages/SpareParts";
import Contracts from "./pages/Contracts";
import Alerts from "./pages/Alerts";
import TripAnalytics from "./pages/TripAnalytics";
import CostAnalytics from "./pages/CostAnalytics";
import CombinedAnalytics from "./pages/CombinedAnalytics";
import Dispatch from "./pages/Dispatch";
import NotFound from "./pages/NotFound";
import InvitationLetter from "./pages/InvitationLetter";
import VehicleInspections from "./pages/VehicleInspections";
import VehicleIncidentReports from "./pages/VehicleIncidentReports";
import VehicleLeasing from "./pages/VehicleLeasing";
import Auth from "./pages/Auth";
import SettingsSecurity from "./pages/SettingsSecurity";
import Forbidden from "./pages/Forbidden";
import AccessGuard from "@/components/auth/AccessGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<Layout />}>
              <Route path="dashboard" element={<AccessGuard><Dashboard /></AccessGuard>} />
              <Route path="vehicles" element={<AccessGuard><Vehicles /></AccessGuard>} />
              <Route path="drivers" element={<AccessGuard><Drivers /></AccessGuard>} />
              <Route path="trips" element={<AccessGuard><Trips /></AccessGuard>} />
              <Route path="clients" element={<AccessGuard><Clients /></AccessGuard>} />
              <Route path="maintenance" element={<AccessGuard><Maintenance /></AccessGuard>} />
              <Route path="fuel-logs" element={<AccessGuard><FuelLogs /></AccessGuard>} />
              <Route path="reports" element={<AccessGuard><Reports /></AccessGuard>} />
              <Route path="settings" element={<AccessGuard><Settings /></AccessGuard>} />
              <Route path="settings/security" element={<AccessGuard><SettingsSecurity /></AccessGuard>} />
              <Route path="403" element={<Forbidden />} />
              <Route path="profile" element={<AccessGuard><Profile /></AccessGuard>} />
              <Route path="quotations" element={<AccessGuard><Quotations /></AccessGuard>} />
              <Route path="invoices" element={<AccessGuard><Invoices /></AccessGuard>} />
              <Route path="spare-parts" element={<AccessGuard><SpareParts /></AccessGuard>} />
              <Route path="contracts" element={<AccessGuard><Contracts /></AccessGuard>} />
              <Route path="alerts" element={<AccessGuard><Alerts /></AccessGuard>} />
              <Route path="trip-analytics" element={<AccessGuard><TripAnalytics /></AccessGuard>} />
              <Route path="cost-analytics" element={<AccessGuard><CostAnalytics /></AccessGuard>} />
              <Route path="combined-analytics" element={<AccessGuard><CombinedAnalytics /></AccessGuard>} />
              <Route path="dispatch" element={<AccessGuard><Dispatch /></AccessGuard>} />
              <Route path="invitation-letter" element={<AccessGuard><InvitationLetter /></AccessGuard>} />
              <Route path="vehicle-inspections" element={<AccessGuard><VehicleInspections /></AccessGuard>} />
              <Route path="vehicle-incident-reports" element={<AccessGuard><VehicleIncidentReports /></AccessGuard>} />
              <Route path="vehicle-leasing" element={<AccessGuard><VehicleLeasing /></AccessGuard>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
