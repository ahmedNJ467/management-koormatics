import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "./ErrorBoundary";
import ChunkErrorBoundary from "./ChunkErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { getCachedSession, sessionCache } from "@/lib/session-cache";
import { debugDomainDetection } from "@/utils/subdomain";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = memo(function Layout({ children }: LayoutProps) {
  const { isAllowed, loading: _loading } = useTenantScope();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open by default
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false); // Add mounted state for hydration
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();

  // Ensure component is mounted on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug domain detection - only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      debugDomainDetection();
    }
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
  }, []);

  // Check authentication status
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // First check sessionStorage for immediate response
        if (typeof window !== "undefined") {
          const cachedSession = sessionStorage.getItem("supabase.auth.token");
          if (cachedSession) {
            try {
              const session = JSON.parse(cachedSession);
              if (session?.user) {
                const now = Math.floor(Date.now() / 1000);
                if (!session.expires_at || session.expires_at > now) {
                  setIsAuthenticated(true);
                  return;
                }
              }
            } catch (error) {
              console.warn("Failed to parse cached session:", error);
            }
          }
        }

        // Fallback to Supabase session check
        const {
          data: { session },
        } = await (getCachedSession as any)(supabase);

        if (!mounted) return;

        if (!session?.user) {
          console.log("No valid session found, redirecting to auth");
          router.push("/auth");
          return;
        }

        // Validate session is still valid
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log("Session expired, redirecting to auth");
          sessionCache.clearCache();
          await supabase.auth.signOut({ scope: "local" });
          router.push("/auth");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);

        // Handle refresh token errors
        const { handleAuthError } = await import("@/lib/auth-error-handler");
        await handleAuthError(error);

        if (mounted) {
          router.push("/auth");
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, session?.user?.email);

      // Update cache when auth state changes
      sessionCache.setCachedSession(session);

      if (event === "SIGNED_OUT" || !session?.user) {
        setIsAuthenticated(false);
        // Clear sessionStorage on logout
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("supabase.auth.token");
        }
        // Only redirect if we're not already on auth page to prevent loops
        if (window.location.pathname !== "/auth") {
          router.push("/auth");
        }
      } else if (session?.user) {
        setIsAuthenticated(true);
        // Store session immediately for instant access
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "supabase.auth.token",
              JSON.stringify(session)
            );
          } catch (error) {
            console.warn("Failed to store session in sessionStorage:", error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
  }, []);

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

  // Handle loading and access states
  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <ErrorBoundary>
        <ChunkErrorBoundary>
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </ChunkErrorBoundary>
      </ErrorBoundary>
    );
  }

  const showLoading = isAuthenticated === null;
  const showAccessDenied = !isAllowed && isAuthenticated !== null;

  // Show loading state
  if (showLoading) {
    return (
      <ErrorBoundary>
        <ChunkErrorBoundary>
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </ChunkErrorBoundary>
      </ErrorBoundary>
    );
  }

  // Show access denied state
  if (showAccessDenied) {
    return (
      <ErrorBoundary>
        <ChunkErrorBoundary>
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
        </ChunkErrorBoundary>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ChunkErrorBoundary>
        <div className="h-screen bg-background">
          {/* Always render the main layout structure */}
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
                {/* Always render children - let components handle their own loading/access states */}
                {/* Apply small uniform padding for all pages except dispatch (full-bleed) */}
                {pathname === "/dispatch" ? (
                  children
                ) : (
                  <div className="h-full p-3">{children}</div>
                )}
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
      </ChunkErrorBoundary>
    </ErrorBoundary>
  );
});

export default Layout;
