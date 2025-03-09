
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "@/types/alert";

export const useContractActivitiesData = (limit?: number) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contract-activities", limit],
    queryFn: async () => {
      try {
        const query = supabase
          .from("activities")
          .select("*")
          .eq("type", "contract");
        
        if (limit) {
          query.limit(limit);
        }
        
        query.order("timestamp", { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data.map(activity => ({
          id: activity.id,
          title: activity.title,
          timestamp: activity.timestamp,
          type: activity.type,
          related_id: activity.related_id,
          created_at: activity.created_at,
          updated_at: activity.updated_at
        })) as Activity[];
      } catch (err) {
        console.error("Error fetching contract activities:", err);
        throw err;
      }
    }
  });
  
  return {
    activities: data || [],
    isLoading,
    error,
    refetch
  };
};
