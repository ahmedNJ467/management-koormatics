import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePageAccess } from "@/hooks/use-page-access";

export default function AccessGuard({ children, pageId }: { children: ReactNode; pageId?: string }) {
  const location = useLocation();
  const id = pageId || location.pathname;
  const { data: pages = [], isLoading } = usePageAccess();

  if (isLoading) return null; // could add spinner

  if (pages.includes(id) || pages.includes("*")) {
    return <>{children}</>;
  }
  return <Navigate to="/403" replace />;
} 