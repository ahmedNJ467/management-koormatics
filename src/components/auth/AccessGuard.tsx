import { useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { usePageAccess } from "@/hooks/use-page-access";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccessGuardProps {
  children: React.ReactNode;
  pageId?: string;
}

export default function AccessGuard({ children, pageId }: AccessGuardProps) {
  const router = useRouter();
  const { isAllowed, loading } = useTenantScope();
  const { data: pages = [], isLoading } = usePageAccess();
  const { user, loading: authLoading } = useAuth();
  const { loading: rolesLoading, roles } = useRole();

  // Debug logging to understand what's happening
  console.log("AccessGuard Debug:", {
    pageId,
    isAllowed,
    loading,
    isLoading,
    authLoading,
    rolesLoading,
    pages: pages.length > 0 ? pages : "No pages loaded",
    user: user ? "User authenticated" : "No user",
    roles: roles.length > 0 ? roles : "No roles yet",
    hasWildcardAccess: pages.includes("*"),
    hasSpecificAccess: pageId ? pages.includes(pageId) : "No pageId",
    isDevelopment: process.env.NODE_ENV === "development",
  });

  // In development, be more permissive to avoid blocking development
  const isDevelopment = process.env.NODE_ENV === "development";

  // Handle tenant scope redirect only when we're sure user is not allowed
  // Wait for roles to actually load before making access decisions
  useEffect(() => {
    // Don't check access until ALL of these are ready:
    // 1. Auth is not loading (session is restored)
    // 2. Roles are not loading (roles query completed)
    // 3. Tenant scope is not loading
    // This prevents false negatives during initial role loading after login
    if (authLoading || rolesLoading || loading) {
      // Still loading - don't make access decisions yet
      console.log("AccessGuard: Still loading, not making access decisions", {
        authLoading,
        rolesLoading,
        loading
      });
      return;
    }

    // If we have a user but no roles after loading completed, this might be a timing issue
    // Give it a bit more time before making decisions
    if (user && roles.length === 0 && !rolesLoading) {
      console.log("AccessGuard: User exists but no roles loaded yet, waiting...");
      return;
    }

    // Only sign out if:
    // 1. Not in development
    // 2. All loading is complete (auth, roles, tenant scope)
    // 3. User is authenticated
    // 4. User is definitely not allowed (roles loaded and access denied)
    if (!isAllowed && user && !isDevelopment && !authLoading && !rolesLoading) {
      console.log("❌ LOGOUT TRIGGERED BY ACCESSGUARD:", {
        reason: "User not allowed for tenant",
        pageId,
        isAllowed,
        user: user?.email,
        roles,
        authLoading,
        rolesLoading,
        loading,
        isDevelopment,
        timestamp: new Date().toISOString(),
      });
      // Sign out the user and redirect to login
      supabase.auth.signOut({ scope: "local" }).then(() => {
        // Clear session storage
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("supabase.auth.token");
            localStorage.removeItem("koormatics_saved_email");
            localStorage.removeItem("koormatics_remember_me");
          } catch (error) {
            console.warn("Failed to clear storage:", error);
          }
        }
        router.replace("/auth");
      });
    }
  }, [loading, rolesLoading, authLoading, isAllowed, user, router, isDevelopment, roles]);

  // Handle page access redirect only when we have page data
  useEffect(() => {
    if (pageId && pages.length > 0 && !isLoading && !isDevelopment) {
      // Normalize dashboard variants to 'dashboard' for access checking
      const normalizedPageId = pageId.startsWith('dashboard-') ? 'dashboard' : pageId;
      const hasAccess = pages.includes("*") || pages.includes(pageId) || pages.includes(normalizedPageId);
      if (!hasAccess) {
        console.log(`No access to page: ${pageId} - signing out and redirecting to login`);
        // Sign out the user and redirect to login
        supabase.auth.signOut({ scope: "local" }).then(() => {
          // Clear session storage
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("supabase.auth.token");
              localStorage.removeItem("koormatics_saved_email");
              localStorage.removeItem("koormatics_remember_me");
            } catch (error) {
              console.warn("Failed to clear storage:", error);
            }
          }
          router.replace("/auth");
        });
      }
    }
  }, [pageId, pages, isLoading, router, isDevelopment]);

  // Show loading state only when both checks are loading and we have a user
  // But only show loading for a short time to prevent blocking
  if (loading && isLoading && user && !isDevelopment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // In development, allow access more liberally
  // Allow access if user is authenticated and either:
  // 1. Has wildcard access (*)
  // 2. Has specific page access
  // 3. Has normalized dashboard access (for dashboard variants)
  // 4. No pageId specified (general access)
  // 5. Still loading (optimistic rendering)
  // 6. In development mode (for easier development)
  const normalizedPageId = pageId?.startsWith('dashboard-') ? 'dashboard' : pageId;
  const hasAccess =
    isDevelopment || // Allow all access in development
    !pageId ||
    pages.includes("*") ||
    pages.includes(pageId || "") ||
    pages.includes(normalizedPageId || "") ||
    isLoading; // Allow access while loading

  // If all checks pass, render children
  // Always render children to avoid hooks order violations
  return <>{children}</>;
}
