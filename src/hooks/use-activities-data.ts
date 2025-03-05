
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";

export const useActivitiesData = (limit: number = 5) => {
  const { handleError } = useApiErrorHandler();

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
