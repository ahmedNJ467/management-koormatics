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
import { cn } from "@/lib/utils";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { useAuth } from "@/hooks/useAuth";

let sidebarStateRef = false;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = memo(function Layout({ children }: LayoutProps) {
  const { isAllowed, loading: _loading } = useTenantScope();
  const [sidebarOpenState, _setSidebarOpenState] = useState(() => sidebarStateRef);

  const setSidebarOpen = useCallback(
    (
      value: boolean | ((prev: boolean) => boolean)
    ) => {
      _setSidebarOpenState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        sidebarStateRef = next;
        return next;
      });
    },
    []
  );

  const sidebarOpen = sidebarOpenState;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false); // Add mounted state for hydration
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();

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

  // Sidebar is permanently closed per requirements

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
    }
  }, [isMobile, setSidebarOpen]);

  // Handle sidebar toggle with useCallback to prevent unnecessary re-renders
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

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

  // Handle auto-logout after 10 minutes of inactivity
  const handleInactivityTimeout = useCallback(async () => {
    try {
      // Sign out user
      await signOut();

      // Redirect to auth page if not already there
      if (pathname !== "/auth") {
        router.push("/auth");
      }
    } catch (error) {
      console.error("Error during inactivity timeout logout:", error);
      // Fallback: clear storage and redirect
      try {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.token");
        if (pathname !== "/auth") {
          router.push("/auth");
        }
      } catch (e) {
        console.error("Error during fallback logout:", e);
      }
    }
  }, [signOut, router, pathname]);

  // Use inactivity timeout hook (only when authenticated)
  useInactivityTimeout({
    timeoutMs: 10 * 60 * 1000, // 10 minutes
    enabled: isAuthenticated === true, // Only enable when authenticated
    onTimeout: handleInactivityTimeout,
  });

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
              className={cn(
                sidebarOpen ? "w-64" : "w-0",
                "transition-all duration-300 ease-in-out",
                "bg-background border-r overflow-hidden",
                // Fixed positioning on mobile to ensure it appears above overlay
                isMobile && sidebarOpen
                  ? "fixed top-16 left-0 h-[calc(100vh-4rem)] z-50"
                  : "relative"
              )}
              onClick={(e) => {
                // Stop propagation to prevent overlay from closing sidebar when clicking inside
                if (isMobile) {
                  e.stopPropagation();
                }
              }}
            >
              <Sidebar onLinkClick={isMobile ? () => setSidebarOpen(false) : undefined} />
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
