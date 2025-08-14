import { useMemo } from "react";
import { getSubdomainFromHost, AppDomain } from "@/utils/subdomain";
import { useRole } from "@/hooks/useRole";

export type DomainRole =
  | "super_admin"
  | "fleet_manager"
  | "operations_manager"
  | "finance_manager";

export function useTenantScope() {
  const domain: AppDomain = useMemo(
    () => getSubdomainFromHost(window.location.hostname),
    []
  );
  const { hasRole, roles, loading } = useRole();

  const isAllowed = useMemo(() => {
    if (loading) return false;
    // If user has any role, allow base access; domain checks refine it further
    if (roles.length === 0) return false;
    if (hasRole("super_admin")) return true;
    if (domain === "fleet") return hasRole("fleet_manager");
    if (domain === "operations") return hasRole("operations_manager");
    if (domain === "finance") return hasRole("finance_manager");
    // management: allow any domain manager too (central portal)
    return (
      hasRole("super_admin") ||
      hasRole("fleet_manager") ||
      hasRole("operations_manager") ||
      hasRole("finance_manager")
    );
  }, [domain, hasRole, roles.length, loading]);

  return { domain, isAllowed, loading };
}
