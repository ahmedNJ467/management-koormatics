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

      const { data, error } = await supabase
        .from("vw_user_roles")
        .select("roles")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) return [];

      const dbRoles = (data?.roles as string[]) || [];
      if (dbRoles.length > 0) return dbRoles;

      const meta = (session?.user.user_metadata as any) || {};
      const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
        ? meta.koormatics_role
        : meta?.role
        ? [meta.role]
        : [];
      return metaRoles;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
