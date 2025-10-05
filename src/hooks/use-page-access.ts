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

        // Try to fetch from vw_user_pages view
        const { data, error } = await supabase
          .from("vw_user_pages")
          .select("pages")
          .eq("user_id", uid)
          .maybeSingle();

        if (error) {
          console.error("Error fetching page access from vw_user_pages:", {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          // If the view doesn't exist or has issues, try alternative approach
          if (
            error.code === "PGRST116" ||
            error.message?.includes("relation") ||
            error.message?.includes("does not exist")
          ) {
            console.log(
              "vw_user_pages view not found, trying alternative approach"
            );

            // Try to get user roles directly
            const { data: rolesData, error: rolesError } = await supabase
              .from("user_roles")
              .select("role_slug")
              .eq("user_id", uid);

            if (rolesError) {
              console.error("Error fetching user roles:", rolesError);
              return ["*"]; // Return wildcard access as fallback
            }

            // If user has super_admin role, give wildcard access
            if (rolesData?.some((role) => role.role_slug === "super_admin")) {
              return ["*"];
            }

            // Otherwise, return basic pages
            return ["dashboard", "vehicles", "drivers", "trips"];
          }

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
