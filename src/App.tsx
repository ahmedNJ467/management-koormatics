import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Maintenance from "@/pages/Maintenance";
import FuelLogs from "@/pages/FuelLogs";
import Trips from "@/pages/Trips";
import Quotations from "@/pages/Quotations";
import Invoices from "@/pages/Invoices";
import Clients from "@/pages/Clients";
import Reports from "@/pages/Reports";
import CostAnalytics from "@/pages/CostAnalytics";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import "@/App.css";

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="fuel-logs" element={<FuelLogs />} />
            <Route path="trips" element={<Trips />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="clients" element={<Clients />} />
            <Route path="reports" element={<Reports />} />
            <Route path="cost-analytics" element={<CostAnalytics />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  )
}

export default App;
