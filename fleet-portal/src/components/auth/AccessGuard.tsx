import { useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { usePageAccess } from "@/hooks/use-page-access";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface AccessGuardProps {
  children: React.ReactNode;
  pageId?: string;
}

export default function AccessGuard({ children, pageId }: AccessGuardProps) {
  const router = useRouter();
  const { isAllowed, loading } = useTenantScope();
  const { data: pages = [], isLoading } = usePageAccess();
  const { user } = useAuth();

  // Debug logging to understand what's happening
  console.log("AccessGuard Debug:", {
    pageId,
    isAllowed,
    loading,
    isLoading,
    pages: pages.length > 0 ? pages : "No pages loaded",
    user: user ? "User authenticated" : "No user",
    hasWildcardAccess: pages.includes("*"),
    hasSpecificAccess: pageId ? pages.includes(pageId) : "No pageId",
    isDevelopment: process.env.NODE_ENV === "development",
  });

  // In development, be more permissive to avoid blocking development
  const isDevelopment = process.env.NODE_ENV === "development";

  // Handle tenant scope redirect only when we're sure user is not allowed
  useEffect(() => {
    if (!loading && !isAllowed && user && !isDevelopment) {
      console.log("Redirecting to /403 - User not allowed for tenant");
      router.push("/403");
    }
  }, [loading, isAllowed, user, router, isDevelopment]);

  // Handle page access redirect only when we have page data
  useEffect(() => {
    if (pageId && pages.length > 0 && !isLoading && !isDevelopment) {
      // Normalize dashboard variants to 'dashboard' for access checking
      const normalizedPageId = pageId.startsWith('dashboard-') ? 'dashboard' : pageId;
      const hasAccess = pages.includes("*") || pages.includes(pageId) || pages.includes(normalizedPageId);
      if (!hasAccess) {
        console.log(`Redirecting to /403 - No access to page: ${pageId}`);
        router.push("/403");
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
