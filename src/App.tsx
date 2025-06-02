
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Clients from "./pages/Clients";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/*" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="trips" element={<Trips />} />
              <Route path="clients" element={<Clients />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="fuel-logs" element={<FuelLogs />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="spare-parts" element={<SpareParts />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="trip-analytics" element={<TripAnalytics />} />
              <Route path="cost-analytics" element={<CostAnalytics />} />
              <Route path="combined-analytics" element={<CombinedAnalytics />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
