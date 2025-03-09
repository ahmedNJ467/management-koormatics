
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";

interface UseAlertsDataProps {
  activeOnly?: boolean;
  limit?: number;
  type?: string;
  priority?: string;
}

export const useAlertsData = ({
  activeOnly = true,
  limit,
  type,
  priority
}: UseAlertsDataProps = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["alerts", activeOnly, limit, type, priority],
    queryFn: async () => {
      try {
        let query = supabase.from("alerts").select("*");
        
        if (activeOnly) {
          query = query.eq("resolved", false);
        }
        
        if (type) {
          query = query.eq("type", type);
        }
        
        if (priority) {
          query = query.eq("priority", priority);
        }
        
        if (limit) {
          query = query.limit(limit);
        }
        
        query = query.order("date", { ascending: false });
        
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
        console.error("Error fetching alerts:", err);
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
