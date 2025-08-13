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
  const { hasRole } = useRole();

  const isAllowed = useMemo(() => {
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
  }, [domain, hasRole]);

  return { domain, isAllowed };
}
