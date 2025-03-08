
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useContractActivitiesData = (limit: number = 5) => {
  const { handleError } = useApiErrorHandler();
  const queryClient = useQueryClient();

  // Set up real-time listener for activities table
  useEffect(() => {
    const activitiesChannel = supabase
      .channel('contract-activities-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activities' 
      }, () => {
        // Invalidate and refetch the activities query when any change happens
        queryClient.invalidateQueries({ queryKey: ["activities"] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(activitiesChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["activities", limit],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return data as Activity[];
      } catch (error) {
        throw handleError(error, "Failed to fetch activities");
      }
    }
  });
};
