
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";

export const useContractAlertsData = (limit?: number) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contract-alerts", limit],
    queryFn: async () => {
      try {
        const query = supabase
          .from("alerts")
          .select("*")
          .eq("type", "contract")
          .eq("resolved", false);
        
        if (limit) {
          query.limit(limit);
        }
        
        query.order("date", { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data.map(alert => ({
          id: alert.id,
          title: alert.title,
          priority: alert.priority,
          date: alert.date,
          created_at: alert.created_at,
          updated_at: alert.updated_at,
          resolved: alert.resolved,
          type: alert.type,
          description: alert.description,
          related_id: alert.related_id,
          related_type: alert.related_type
        })) as Alert[];
      } catch (err) {
        console.error("Error fetching contract alerts:", err);
        throw err;
      }
    }
  });
  
  return {
    alerts: data || [],
    isLoading,
    error,
    refetch
  };
};
