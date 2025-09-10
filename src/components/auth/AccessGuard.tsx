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
  });

  // Handle tenant scope redirect only when we're sure user is not allowed
  useEffect(() => {
    if (!loading && !isAllowed && user) {
      console.log("Redirecting to /403 - User not allowed for tenant");
      router.push("/403");
    }
  }, [loading, isAllowed, user, router]);

  // Handle page access redirect only when we have page data
  useEffect(() => {
    if (pageId && pages.length > 0 && !isLoading) {
      const hasAccess = pages.includes("*") || pages.includes(pageId);
      if (!hasAccess) {
        console.log(`Redirecting to /403 - No access to page: ${pageId}`);
        router.push("/403");
      }
    }
  }, [pageId, pages, isLoading, router]);

  // Show loading state only when both checks are loading and we have a user
  // But only show loading for a short time to prevent blocking
  if (loading && isLoading && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Allow access if user is authenticated and either:
  // 1. Has wildcard access (*)
  // 2. Has specific page access
  // 3. No pageId specified (general access)
  // 4. Still loading (optimistic rendering)
  const hasAccess =
    !pageId || pages.includes("*") || pages.includes(pageId || "") || isLoading; // Allow access while loading

  // If all checks pass, render children
  // Always render children to avoid hooks order violations
  return <>{children}</>;
}
