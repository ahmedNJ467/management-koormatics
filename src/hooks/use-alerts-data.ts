
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";
import { useApiErrorHandler } from "@/lib/api-error-handler";

export const useAlertsData = (filter?: {
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
