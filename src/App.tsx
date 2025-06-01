
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
import ClientPortal from "./pages/ClientPortal";

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
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/vehicles" element={<Layout><Vehicles /></Layout>} />
            <Route path="/drivers" element={<Layout><Drivers /></Layout>} />
            <Route path="/trips" element={<Layout><Trips /></Layout>} />
            <Route path="/clients" element={<Layout><Clients /></Layout>} />
            <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
            <Route path="/fuel-logs" element={<Layout><FuelLogs /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/quotations" element={<Layout><Quotations /></Layout>} />
            <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
            <Route path="/spare-parts" element={<Layout><SpareParts /></Layout>} />
            <Route path="/contracts" element={<Layout><Contracts /></Layout>} />
            <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
            <Route path="/trip-analytics" element={<Layout><TripAnalytics /></Layout>} />
            <Route path="/cost-analytics" element={<Layout><CostAnalytics /></Layout>} />
            <Route path="/combined-analytics" element={<Layout><CombinedAnalytics /></Layout>} />
            <Route path="/dispatch" element={<Layout><Dispatch /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
