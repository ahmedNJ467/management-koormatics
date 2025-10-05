import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePageAccess = () => {
  return useQuery<string[]>({
    queryKey: ["page_access"],
    queryFn: async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          return ["*"]; // Return wildcard access as fallback
        }

        const uid = sessionData.session?.user.id;
        if (!uid) {
          console.log("No authenticated user, returning wildcard access");
          return ["*"]; // Return wildcard access for unauthenticated users
        }

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

        // If no data found, return wildcard access
        if (!data) {
          console.log(
            "No page access data found for user, returning wildcard access"
          );
          return ["*"];
        }

        return (data.pages as string[]) || ["*"];
      } catch (error) {
        console.error("Unexpected error in usePageAccess:", error);
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
