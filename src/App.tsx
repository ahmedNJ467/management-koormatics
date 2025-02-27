
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Clients from "./pages/Clients";
import Quotations from "./pages/Quotations";
import Invoices from "./pages/Invoices";
import Trips from "./pages/Trips";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="fuel-logs" element={<FuelLogs />} />
          <Route path="clients" element={<Clients />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="trips" element={<Trips />} />
          <Route path="settings" element={<Settings />} />
          <Route path="auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/index.html" element={<Index />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
