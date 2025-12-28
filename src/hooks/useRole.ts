import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const [sessionReady, setSessionReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Wait for session to be ready before fetching roles
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      console.log("useRole: Checking session...");
      
      // ONLY check Supabase - don't trust sessionStorage cache, it can be stale
      const { data: { session } } = await supabase.auth.getSession();
      console.log("useRole: Supabase session check", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        metadata: session?.user?.user_metadata
      });
      
      if (mounted && session?.user) {
        setDebugInfo({ source: "supabase", userId: session.user.id });
        setSessionReady(true);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Use React Query for better caching and performance
  // Only enable the query when session is ready
  const { data: roles = [], isLoading: queryLoading } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      console.log("useRole: Running roles query...");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      
      console.log("useRole: Query session check", {
        hasSession: !!session,
        userId,
        email: session?.user?.email
      });
      
      if (!userId) {
        console.warn("useRole: No userId in query, returning empty roles");
        return [];
      }

      // Try to get roles from user metadata first (faster)
      const meta = (session?.user.user_metadata as any) || {};
      console.log("useRole: User metadata", meta);
      
      const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
        ? meta.koormatics_role
        : meta?.role
        ? [meta.role]
        : [];

      console.log("useRole: Roles from metadata", metaRoles);

      // If we have roles from metadata, return them immediately
      if (metaRoles.length > 0) {
        console.log("useRole: Returning roles from metadata", metaRoles);
        return metaRoles;
      }

      // Fallback to database query only if no metadata roles
      console.log("useRole: No metadata roles, querying database...");
      try {
        const { data, error } = await supabase
          .from("vw_user_roles")
          .select("roles")
          .eq("user_id", userId!)
          .maybeSingle();

        console.log("useRole: Database query result", { data, error });

        if (error) {
          console.warn("useRole: Database query error", error);
          return metaRoles;
        }

        const dbRoles = (data?.roles as string[]) || [];
        console.log("useRole: Returning roles from database", dbRoles);
        return dbRoles.length > 0 ? dbRoles : metaRoles;
      } catch (error) {
        console.error("Error fetching roles from database:", error);
        return metaRoles; // Return metadata roles as fallback
      }
    },
    enabled: sessionReady, // Only run query when session is ready
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1, // Only retry once on failure
    // Add timeout to prevent hanging
    meta: {
      timeout: 5000, // 5 second timeout
    },
  });

  // Debug logging

  // Debug logging removed for Fast Refresh compatibility

  // React Query will automatically handle auth state changes
  // No need for manual subscription management

  return {
    roles,
    loading: !sessionReady || queryLoading, // Loading if session not ready OR query is running
    hasRole: (role: string) => roles.includes(role),
  };
};
