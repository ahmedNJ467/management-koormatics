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

    // Only run on client side
    if (typeof window === "undefined") return;

    // Cache domain detection to avoid repeated calculations
    const cachedDomain = sessionStorage.getItem("koormatics-domain");
    if (cachedDomain) {
      setDomain(cachedDomain as AppDomain);
    } else {
      const hostname = window.location.hostname;
      const detectedDomain = getSubdomainFromHost(hostname);
      setDomain(detectedDomain);
      // Cache the detected domain
      sessionStorage.setItem("koormatics-domain", detectedDomain);
    }
  }, []);

  const isAllowed = useMemo(() => {
    // During SSR or initial load, always allow access to prevent hydration mismatch
    if (typeof window === "undefined" || !mounted) return true;

    // If still loading, allow access optimistically
    if (loading) return true;

    // If user has any role, allow base access; domain checks refine it further
    if (roles.length === 0) return true; // Allow access while roles are loading
    if (hasRole("super_admin")) return true;
    if (domain === "fleet") return hasRole("fleet_manager");
    if (domain === "operations") return hasRole("operations_manager");
    if (domain === "finance") return hasRole("finance_manager");
    // management: ONLY super_admin can access the management portal
    if (domain === "management") return hasRole("super_admin");
    // Default: deny access if domain doesn't match any role
    return false;
  }, [domain, hasRole, roles.length, loading, mounted]);

  // Only show loading on initial mount, not on subsequent checks
  // Reduce loading time by being more optimistic
  // During SSR, never show loading to prevent hydration mismatch
  const isLoading =
    typeof window !== "undefined" && loading && !mounted && roles.length === 0;

  // Debug logging
  console.log("useTenantScope Debug:", {
    domain,
    roles: roles.length > 0 ? roles : "No roles",
    loading,
    mounted,
    isAllowed,
    isLoading,
  });

  return { domain, isAllowed, loading: isLoading };
}
