
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useSparePartsQuery = (sortConfig: {column: string, direction: 'asc' | 'desc'}) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["spare_parts", sortConfig],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("spare_parts")
          .select("*")
          .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });

        if (error) {
          console.error("Error fetching spare parts:", error);
          throw new Error(error.message);
        }

        return data as SparePart[];
      } catch (error) {
        console.error("Error in spare parts query:", error);
        throw error;
      }
    },
  });
};
