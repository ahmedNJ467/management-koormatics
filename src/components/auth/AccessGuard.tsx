import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
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

  useEffect(() => {
    if (!loading && !isAllowed) {
      router.push("/403");
    }
  }, [loading, isAllowed, router]);

  // Show loading state while checking permissions
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user has access to the specific page
  if (pageId) {
    const hasAccess = pages.includes("*") || pages.includes(pageId);
    if (!hasAccess) {
      router.push("/403");
      return null;
    }
  }

  // Check if tenant scope is allowed
  if (!isAllowed) {
    router.push("/403");
    return null;
  }

  // If all checks pass, render children
  return <>{children}</>;
}
