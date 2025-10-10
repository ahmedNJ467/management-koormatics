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
          return []; // Strict fallback: no access on session error
        }

        const uid = sessionData.session?.user.id;
        if (!uid) {
          console.log("No authenticated user, returning no access");
          return []; // No access for unauthenticated users
        }

        // Try to fetch from vw_user_pages view
        const { data, error } = await supabase
          .from("vw_user_pages")
          .select("pages")
          .eq("user_id", uid)
          .maybeSingle();

        if (error) {
          // Log the raw error object first (helps when devtools collapses structured logs)
          console.error(
            "Error fetching page access from vw_user_pages (raw):",
            error
          );

          // Then log a safely-serializable summary to avoid `{}` display issues
          const serialized = {
            message: error?.message ?? "<no message>",
            details: (error as any)?.details ?? "<no details>",
            hint: (error as any)?.hint ?? "<no hint>",
            code: (error as any)?.code ?? "<no code>",
          };
          console.error(
            "Error fetching page access from vw_user_pages (summary):",
            serialized,
            "json:",
            JSON.stringify(serialized)
          );

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
              return []; // Strict fallback: no access on roles error
            }

            // If user has super_admin role, give wildcard access
            if (rolesData?.some((role) => role.role_slug === "super_admin")) {
              return ["*"];
            }

            // Otherwise, return no access until explicit pages are defined
            return [];
          }

          // Strict fallback on other errors
          return [];
        }

        // If no data found, return no access
        if (!data) {
          console.log(
            "No page access data found for user, returning no access"
          );
          return [];
        }

        return (data.pages as string[]) || [];
      } catch (error) {
        console.error("Unexpected error in usePageAccess:", error);
        // Strict fallback on unexpected error
        return [];
      }
    },
    staleTime: 30 * 1000, // Cache for 30 seconds (much shorter for auth data)
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus for fresh auth data
    refetchOnMount: true, // Always refetch when component mounts for fresh auth data
    retry: 1, // Only retry once on failure
    // Add timeout to prevent hanging
    meta: {
      timeout: 5000, // 5 second timeout
    },
  });
};
