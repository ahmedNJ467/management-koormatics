import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../types";
import { safeArrayResult } from "@/lib/utils/type-guards";

export const useSparePartsQuery = (sortConfig: {
  column: string;
  direction: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["spare_parts", sortConfig],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("spare_parts")
          .select("*")
          .order(sortConfig.column, {
            ascending: sortConfig.direction === "asc",
          });

        if (error) {
          console.error("Error fetching spare parts:", error);
          throw new Error(error.message);
        }

        return safeArrayResult<SparePart>(data);
      } catch (error) {
        console.error("Error in spare parts query:", error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};
