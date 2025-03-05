
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useSparePartsQuery = (sortConfig: {column: string, direction: 'asc' | 'desc'}) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["spare_parts", sortConfig],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });

      if (error) {
        console.error("Error fetching spare parts:", error);
        toast({
          title: "Error loading spare parts",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data as SparePart[];
    },
  });
};
