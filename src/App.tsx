import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import {
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
  NotFound,
  InvitationLetter,
  VehicleInspections,
  VehicleIncidentReports,
  VehicleLeasing,
  TripFinance,
  Auth,
  SettingsSecurity,
  Forbidden,
} from "@/routes/pages";
import AccessGuard from "@/components/auth/AccessGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={<Layout />}>
                  <Route
                    path="dashboard"
                    element={
                      <AccessGuard>
                        <Dashboard />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="vehicles"
                    element={
                      <AccessGuard>
                        <Vehicles />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="drivers"
                    element={
                      <AccessGuard>
                        <Drivers />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="trips"
                    element={
                      <AccessGuard>
                        <Trips />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="clients"
                    element={
                      <AccessGuard>
                        <Clients />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="maintenance"
                    element={
                      <AccessGuard>
                        <Maintenance />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="fuel-logs"
                    element={
                      <AccessGuard>
                        <FuelLogs />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <AccessGuard>
                        <Reports />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <AccessGuard>
                        <Settings />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="settings/security"
                    element={
                      <AccessGuard>
                        <SettingsSecurity />
                      </AccessGuard>
                    }
                  />
                  <Route path="403" element={<Forbidden />} />
                  <Route
                    path="profile"
                    element={
                      <AccessGuard>
                        <Profile />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="quotations"
                    element={
                      <AccessGuard>
                        <Quotations />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="invoices"
                    element={
                      <AccessGuard>
                        <Invoices />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="spare-parts"
                    element={
                      <AccessGuard>
                        <SpareParts />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="contracts"
                    element={
                      <AccessGuard>
                        <Contracts />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="alerts"
                    element={
                      <AccessGuard>
                        <Alerts />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="trip-analytics"
                    element={
                      <AccessGuard>
                        <TripAnalytics />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="cost-analytics"
                    element={
                      <AccessGuard>
                        <CostAnalytics />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="combined-analytics"
                    element={
                      <AccessGuard>
                        <CombinedAnalytics />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="dispatch"
                    element={
                      <AccessGuard>
                        <Dispatch />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="invitation-letter"
                    element={
                      <AccessGuard>
                        <InvitationLetter />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="vehicle-inspections"
                    element={
                      <AccessGuard>
                        <VehicleInspections />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="vehicle-incident-reports"
                    element={
                      <AccessGuard>
                        <VehicleIncidentReports />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="vehicle-leasing"
                    element={
                      <AccessGuard>
                        <VehicleLeasing />
                      </AccessGuard>
                    }
                  />
                  <Route
                    path="trip-finance"
                    element={
                      <AccessGuard>
                        <TripFinance />
                      </AccessGuard>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
