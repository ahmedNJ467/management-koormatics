
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";

export const useContractActivitiesData = (limit: number = 5) => {
  const { handleError } = useApiErrorHandler();

  return useQuery({
    queryKey: ["activities", limit],
    queryFn: async () => {
      try {
        console.log("Fetching activities with limit:", limit);
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Supabase error fetching activities:", error);
          throw error;
        }

        console.log("Fetched activities data:", data);
        return data as Activity[];
      } catch (error) {
        console.error("Error in useContractActivitiesData:", error);
        throw handleError(error, "Failed to fetch activities");
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 30000 // Consider data stale after 30 seconds
  });
};
