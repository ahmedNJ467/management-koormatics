
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscriptions to relevant tables
    const vehiclesSubscription = supabase
      .channel('dashboard-vehicles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicles'
      }, () => {
        // Invalidate vehicle stats query
        queryClient.invalidateQueries({ queryKey: ["dashboard", "vehicles"] });
        toast.info("Vehicle data updated");
      })
      .subscribe();

    const driversSubscription = supabase
      .channel('dashboard-drivers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers'
      }, () => {
        // Invalidate driver stats query
        queryClient.invalidateQueries({ queryKey: ["dashboard", "drivers"] });
        toast.info("Driver data updated");
      })
      .subscribe();

    const maintenanceSubscription = supabase
      .channel('dashboard-maintenance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance'
      }, () => {
        // Invalidate maintenance and financial data queries
        queryClient.invalidateQueries({ queryKey: ["dashboard", "financial"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
        toast.info("Maintenance data updated");
      })
      .subscribe();

    const fuelLogsSubscription = supabase
      .channel('dashboard-fuel-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fuel_logs'
      }, () => {
        // Invalidate fuel logs and financial data queries
        queryClient.invalidateQueries({ queryKey: ["dashboard", "financial"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
        toast.info("Fuel log data updated");
      })
      .subscribe();

    const tripsSubscription = supabase
      .channel('dashboard-trips')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips'
      }, () => {
        // Invalidate trips and activity data queries
        queryClient.invalidateQueries({ queryKey: ["dashboard", "trips"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
        toast.info("Trip data updated");
      })
      .subscribe();

    const clientsSubscription = supabase
      .channel('dashboard-clients')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients'
      }, () => {
        // Invalidate trips query (which includes client data)
        queryClient.invalidateQueries({ queryKey: ["dashboard", "trips"] });
        toast.info("Client data updated");
      })
      .subscribe();

    // Clean up subscriptions when the component unmounts
    return () => {
      vehiclesSubscription.unsubscribe();
      driversSubscription.unsubscribe();
      maintenanceSubscription.unsubscribe();
      fuelLogsSubscription.unsubscribe();
      tripsSubscription.unsubscribe();
      clientsSubscription.unsubscribe();
    };
  }, [queryClient]);
}
