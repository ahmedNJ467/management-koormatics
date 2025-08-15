import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePageAccess } from "@/hooks/use-page-access";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { useRole } from "@/hooks/useRole";

export default function AccessGuard({
  children,
  pageId,
}: {
  children: ReactNode;
  pageId?: string;
}) {
  const location = useLocation();
  const rawId = pageId || location.pathname;
  const id = rawId.startsWith("/") ? rawId.slice(1) : rawId;
  const firstSegment = id.split("/")[0] || id;
  const { data: pages = [], isLoading } = usePageAccess();
  const { isAllowed, loading } = useTenantScope();
  const { roles } = useRole();

  if (isLoading || loading) return null; // could add spinner

  if (!isAllowed) {
    return <Navigate to="/403" replace />;
  }

  if (
    pages.includes(id) ||
    pages.includes(firstSegment) ||
    pages.includes("*")
  ) {
    return <>{children}</>;
  }
  return <Navigate to="/403" replace />;
}
