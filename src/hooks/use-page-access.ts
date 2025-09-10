import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePageAccess = () => {
  return useQuery<string[]>({
    queryKey: ["page_access"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) return [];

      try {
        const { data, error } = await supabase
          .from("vw_user_pages")
          .select("pages")
          .eq("user_id", uid)
          .maybeSingle();

        if (error) {
          console.error("Error fetching page access:", error);
          // Return wildcard access as fallback to prevent blocking
          return ["*"];
        }

        return (data?.pages as string[]) || ["*"];
      } catch (error) {
        console.error("Error fetching page access:", error);
        // Return wildcard access as fallback to prevent blocking
        return ["*"];
      }
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    retry: 1, // Only retry once on failure
    // Add timeout to prevent hanging
    meta: {
      timeout: 5000, // 5 second timeout
    },
  });
};
