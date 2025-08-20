import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "./ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { debugDomainDetection } from "@/utils/subdomain";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = memo(function Layout({ children }: LayoutProps) {
  const { isAllowed, loading } = useTenantScope();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open by default
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  // Debug domain detection
  useEffect(() => {
    debugDomainDetection();
  }, []);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("koormatics-sidebar-open");
      if (savedState !== null) {
        const parsedState = JSON.parse(savedState);
        setSidebarOpen(parsedState);
      }
    } catch (error) {
      console.warn("Failed to load sidebar state from localStorage:", error);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "koormatics-sidebar-open",
        JSON.stringify(sidebarOpen)
      );
    } catch (error) {
      console.warn("Failed to save sidebar state to localStorage:", error);
    }
  }, [sidebarOpen]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.access_token) {
          console.log("No valid session found, redirecting to auth");
          router.push("/auth");
          return;
        }

        // Validate session is still valid
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log("Session expired, redirecting to auth");
          await supabase.auth.signOut({ scope: "local" });
          router.push("/auth");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth");
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
        router.push("/auth");
      } else if (session && session.access_token) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Set sidebar state based on device type
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      // Only auto-open on desktop if no saved state exists
      const savedState = localStorage.getItem("koormatics-sidebar-open");
      if (savedState === null) {
        setSidebarOpen(true);
      }
    }
  }, [isMobile]);

  // Handle sidebar toggle with useCallback to prevent unnecessary re-renders
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Add keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSidebar]);

  // Show loading state while checking authentication and tenant scope
  if (isAuthenticated === null || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show forbidden state if user doesn't have access to this tenant
  if (!isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this tenant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-background">
        {/* Navbar - Fixed at top */}
        <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
          <Navbar
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Content area below navbar */}
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
          {/* Sidebar - Below navbar, slides in/out */}
          <div
            className={`
            ${sidebarOpen ? "w-64" : "w-0"}
            transition-all duration-300 ease-in-out
            bg-background border-r
            overflow-hidden
          `}
          >
            <Sidebar />
          </div>

          {/* Main Content - Naturally expands/contracts */}
          <div className="flex-1 overflow-hidden">
            <main className="h-full overflow-y-auto bg-muted/20">
              <div className="container mx-auto p-6">{children}</div>
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
});

export default Layout;
