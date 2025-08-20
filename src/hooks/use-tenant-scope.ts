import { useMemo, useState, useEffect } from "react";
import { getSubdomainFromHost, AppDomain } from "@/utils/subdomain";
import { useRole } from "@/hooks/useRole";

export type DomainRole =
  | "super_admin"
  | "fleet_manager"
  | "operations_manager"
  | "finance_manager";

export function useTenantScope() {
  const [domain, setDomain] = useState<AppDomain>("management");
  const [mounted, setMounted] = useState(false);
  const { hasRole, roles, loading } = useRole();

  // Safely access browser APIs after component mounts
  useEffect(() => {
    setMounted(true);
    const hostname = window.location.hostname;
    const detectedDomain = getSubdomainFromHost(hostname);
    setDomain(detectedDomain);
  }, []);

  const isAllowed = useMemo(() => {
    if (loading || !mounted) return false;
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
  }, [domain, hasRole, roles.length, loading, mounted]);

  return { domain, isAllowed, loading: loading || !mounted };
}
