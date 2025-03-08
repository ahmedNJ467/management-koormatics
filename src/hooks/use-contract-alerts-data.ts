
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";

export const useContractAlertsData = (filter?: {
  resolved?: boolean;
  priority?: string;
  type?: string;
  limit?: number;
}) => {
  const { handleError } = useApiErrorHandler();

  return useQuery({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      try {
        console.log("Fetching alerts with filters:", filter);
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

        if (error) {
          console.error("Supabase error fetching alerts:", error);
          throw error;
        }

        console.log("Fetched alerts data:", data);
        return data as Alert[];
      } catch (error) {
        console.error("Error in useContractAlertsData:", error);
        throw handleError(error, "Failed to fetch alerts");
      }
    },
  });
};
