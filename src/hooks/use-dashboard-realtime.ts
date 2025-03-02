
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  // Subscribe to real-time changes for all relevant tables
  useEffect(() => {
    // Create a single channel for all dashboard-related changes
    const channel = supabase
      .channel('dashboard-changes')
      // Listen for vehicle changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, (payload) => {
        console.log('Vehicle change detected:', payload);
        toast('Vehicle data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      // Listen for driver changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'drivers' 
      }, (payload) => {
        console.log('Driver change detected:', payload);
        toast('Driver data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      // Listen for maintenance changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance' 
      }, (payload) => {
        console.log('Maintenance change detected:', payload);
        toast('Maintenance data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      // Listen for fuel logs changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'fuel_logs' 
      }, (payload) => {
        console.log('Fuel log change detected:', payload);
        toast('Fuel data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      // Listen for trip changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trips' 
      }, (payload) => {
        console.log('Trip change detected:', payload);
        toast('Trip data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      // Listen for client changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clients' 
      }, (payload) => {
        console.log('Client change detected:', payload);
        toast('Client data updated');
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .subscribe();

    // Cleanup function to remove the channel when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
