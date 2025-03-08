
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useContractAlertsData = (filter?: {
  resolved?: boolean;
  priority?: string;
  type?: string;
  limit?: number;
}) => {
  const { handleError } = useApiErrorHandler();
  const queryClient = useQueryClient();

  // Set up real-time listener for alerts table
  useEffect(() => {
    const alertsChannel = supabase
      .channel('contract-alerts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, () => {
        // Invalidate and refetch the alerts query when any change happens
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      try {
        let query = supabase.from("alerts").select("*");

        // Apply filters if provided
        if (filter) {
          if (filter.resolved !== undefined) {
            query = query.eq("resolved", filter.resolved);
          }
          if (filter.priority && filter.priority !== "") {
            query = query.eq("priority", filter.priority);
          }
          if (filter.type && filter.type !== "") {
            query = query.eq("type", filter.type);
          }
          if (filter.limit) {
            query = query.limit(filter.limit);
          }
        }

        // Sort by date, with most recent first
        query = query.order("date", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return data as Alert[];
      } catch (error) {
        throw handleError(error, "Failed to fetch alerts");
      }
    },
  });
};
