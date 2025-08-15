import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "./ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { debugDomainDetection } from "@/utils/subdomain";

export default function Layout() {
  const { isAllowed, loading } = useTenantScope();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Debug domain detection
  useEffect(() => {
    debugDomainDetection();
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.access_token) {
          console.log("No valid session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        // Validate session is still valid
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log("Session expired, redirecting to auth");
          await supabase.auth.signOut({ scope: "local" });
          navigate("/auth");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/auth");
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.email);

      if (event === "SIGNED_OUT" || !session || !session.access_token) {
        setIsAuthenticated(false);
        navigate("/auth");
      } else if (session && session.access_token) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Close sidebar by default on mobile devices
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Listen for sidebar toggle events from Dashboard
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };

    window.addEventListener("toggleSidebar", handleToggleSidebar);
    return () => {
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
    };
  }, [sidebarOpen]);

  // Show loading state while checking authentication and tenant scope
  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // After loading/auth checks, if tenant is not allowed, redirect
  if (!isAllowed) return <Navigate to="/403" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ${
            sidebarOpen && !isMobile ? "ml-64" : "ml-0"
          }`}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
