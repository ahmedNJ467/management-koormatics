
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";

interface AlertsFilters {
  resolved?: boolean;
  priority?: string;
  type?: string;
}

export const useContractAlertsData = (filters?: AlertsFilters) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["alerts", filters],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select("*");
      
      // Apply filters if provided
      if (filters) {
        if (filters.resolved !== undefined) {
          query = query.eq("resolved", filters.resolved);
        }
        
        if (filters.priority && filters.priority !== "") {
          query = query.eq("priority", filters.priority);
        }
        
        if (filters.type && filters.type !== "") {
          query = query.eq("type", filters.type);
        }
      }
      
      // Order by date descending
      query = query.order("date", { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as Alert[];
    }
  });

  return {
    alerts: data || [],
    isLoading,
    isError: !!error,
    error,
    refetch
  };
};
