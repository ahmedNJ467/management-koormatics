
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../types";

export const useSparePartsQuery = (sortConfig: {column: string, direction: 'asc' | 'desc'}) => {
  return useQuery({
    queryKey: ["spare_parts", sortConfig],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });

      if (error) {
        console.error("Error fetching spare parts:", error);
        throw error;
      }

      return data as SparePart[];
    },
  });
};
