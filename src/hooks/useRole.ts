import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  // Use React Query for better caching and performance
  const { data: roles = [], isLoading: queryLoading } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return [];

      // Try to get roles from user metadata first (faster)
      const meta = (session?.user.user_metadata as any) || {};
      const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
        ? meta.koormatics_role
        : meta?.role
        ? [meta.role]
        : [];

      // If we have roles from metadata, return them immediately
      if (metaRoles.length > 0) return metaRoles;

      // Fallback to database query only if no metadata roles
      try {
        const { data, error } = await supabase
          .from("vw_user_roles")
          .select("roles")
          .eq("user_id", userId!)
          .maybeSingle();

        if (error) return metaRoles; // Return metadata roles as fallback

        const dbRoles = (data?.roles as string[]) || [];
        return dbRoles.length > 0 ? dbRoles : metaRoles;
      } catch (error) {
        console.error("Error fetching roles from database:", error);
        return metaRoles; // Return metadata roles as fallback
      }
    },
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
  console.log("useRole Debug:", {
    roles: roles.length > 0 ? roles : "No roles",
    queryLoading,
    hasSuperAdmin: roles.includes("super_admin"),
    hasFleetManager: roles.includes("fleet_manager"),
    hasOperationsManager: roles.includes("operations_manager"),
    hasFinanceManager: roles.includes("finance_manager"),
  });

  // React Query will automatically handle auth state changes
  // No need for manual subscription management

  return {
    roles,
    loading: queryLoading,
    hasRole: (role: string) => roles.includes(role),
  };
};
