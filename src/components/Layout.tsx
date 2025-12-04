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
import { SkipLink } from "@/components/ui/skip-link";

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
    let initialCheckComplete = false;
    let sessionRestoreTimeout: NodeJS.Timeout | null = null;
    let finallyBlockTimeout: NodeJS.Timeout | null = null;
    let maxWaitTimeout: NodeJS.Timeout | null = null;
    const mountTime = Date.now();

    // Safety timeout: ensure we never wait more than 5 seconds
    maxWaitTimeout = setTimeout(() => {
      if (mounted && isAuthenticated === null) {
        console.warn("Auth check timeout - defaulting to unauthenticated");
        setIsAuthenticated(false);
        initialCheckComplete = true;
      }
    }, 5000);

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
                  initialCheckComplete = true;
                  if (maxWaitTimeout) {
                    clearTimeout(maxWaitTimeout);
                  }
                  // Verify with Supabase in background, but don't wait
                  setTimeout(async () => {
                    if (!mounted) return;
                    try {
                      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
                      if (supabaseSession?.user) {
                        // Update cache with fresh session from Supabase
                        sessionCache.setCachedSession(supabaseSession);
                        if (typeof window !== "undefined") {
                          try {
                            sessionStorage.setItem("supabase.auth.token", JSON.stringify(supabaseSession));
                          } catch (error) {
                            console.warn("Failed to update session:", error);
                          }
                        }
                      }
                    } catch (error) {
                      console.warn("Background session verification failed:", error);
                    }
                  }, 500);
                  return;
                }
              }
            } catch (error) {
              console.warn("Failed to parse cached session:", error);
            }
          }
        }

        // Fallback to Supabase session check
        // Wait longer for Supabase to restore session from localStorage after page reload
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const {
          data: { session },
        } = await (getCachedSession as any)(supabase);

        if (!mounted) return;

        if (!session?.user) {
          // Check if we have a session in localStorage (Supabase's storage)
          // This might not be restored yet after page reload
          if (typeof window !== "undefined") {
            try {
              const supabaseStorageKey = `sb-${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").split("//")[1]?.split(".")[0] || "project"}-auth-token`;
              const stored = localStorage.getItem(supabaseStorageKey);
              if (stored) {
                // Session exists in localStorage but not restored yet - wait a bit more
                console.log("Session found in localStorage, waiting for Supabase to restore...");
                setTimeout(async () => {
                  if (!mounted) return;
                  const { data: { session: restoredSession } } = await supabase.auth.getSession();
                  if (restoredSession?.user) {
                    setIsAuthenticated(true);
                    sessionCache.setCachedSession(restoredSession);
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("supabase.auth.token", JSON.stringify(restoredSession));
                    }
                    initialCheckComplete = true;
                    if (maxWaitTimeout) {
                      clearTimeout(maxWaitTimeout);
                    }
                    return;
                  }
                  // Still no session after waiting - set to false and redirect
                  setIsAuthenticated(false);
                  initialCheckComplete = true;
                  if (maxWaitTimeout) {
                    clearTimeout(maxWaitTimeout);
                  }
                  if (mounted) {
                    console.log("No valid session found after restore attempt, redirecting to auth");
                    router.push("/auth");
                  }
                }, 500);
                // Return here - the timeout will handle setting the state
                // Don't set initialCheckComplete here as we're waiting for async operation
                return;
              }
            } catch (e) {
              // Ignore errors checking localStorage
            }
          }
          
          // No session found - set to false
          setIsAuthenticated(false);
          initialCheckComplete = true;
          if (maxWaitTimeout) {
            clearTimeout(maxWaitTimeout);
          }
          
          // Only redirect if we're sure there's no session
          if (mounted) {
            console.log("No valid session found, redirecting to auth");
            router.push("/auth");
          }
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
        initialCheckComplete = true;
        if (maxWaitTimeout) {
          clearTimeout(maxWaitTimeout);
        }
      } catch (error) {
        console.error("Auth check error:", error);

        // Handle refresh token errors
        const { handleAuthError } = await import("@/lib/auth-error-handler");
        await handleAuthError(error);

        // Always set authentication state, even on error
        if (mounted) {
          setIsAuthenticated(false);
          initialCheckComplete = true;
          if (maxWaitTimeout) {
            clearTimeout(maxWaitTimeout);
          }
          router.push("/auth");
        }
      } finally {
        // Mark as complete after a delay to allow session restoration
        // But only if we haven't already set a state and initial check isn't complete
        finallyBlockTimeout = setTimeout(() => {
          if (mounted && !initialCheckComplete && isAuthenticated === null) {
            console.warn("Auth check completed but state not set - defaulting to false");
            setIsAuthenticated(false);
            initialCheckComplete = true;
          } else if (!initialCheckComplete) {
            // Mark as complete even if state was set
            initialCheckComplete = true;
          }
          if (maxWaitTimeout) {
            clearTimeout(maxWaitTimeout);
          }
        }, 2000);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, session?.user?.email);

      // Handle INITIAL_SESSION event - Supabase is restoring session from storage
      // During this event, session might be null initially, so we need to wait
      if (event === "INITIAL_SESSION") {
        // Give Supabase more time to restore the session
        // If session is null, wait longer and check multiple times
        if (!session?.user) {
          // Check for cached session first
          const cachedSession = (() => {
            if (typeof window === "undefined") return null;
            try {
              const cached = sessionStorage.getItem("supabase.auth.token");
              if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.user) {
                  const now = Math.floor(Date.now() / 1000);
                  if (!parsed.expires_at || parsed.expires_at > now) {
                    return parsed;
                  }
                }
              }
            } catch {
              return null;
            }
            return null;
          })();

          if (cachedSession) {
            // We have a cached session, use it and wait for Supabase to catch up
            console.log("Using cached session during INITIAL_SESSION");
            setIsAuthenticated(true);
            sessionCache.setCachedSession(cachedSession);
          }

          // Wait and check multiple times for Supabase to restore
          const checkSession = async (attempt: number = 1) => {
            if (!mounted) return;
            if (attempt > 5) {
              // After 5 attempts (2.5 seconds), give up
              if (!cachedSession) {
                console.log("Session not restored after INITIAL_SESSION, checking one more time...");
                const { data: { session: finalCheck } } = await supabase.auth.getSession();
                if (finalCheck?.user) {
                  setIsAuthenticated(true);
                  sessionCache.setCachedSession(finalCheck);
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.setItem("supabase.auth.token", JSON.stringify(finalCheck));
                    } catch (error) {
                      console.warn("Failed to store session:", error);
                    }
                  }
                }
              }
              return;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            if (!mounted) return;

            const { data: { session: restoredSession } } = await supabase.auth.getSession();
            if (restoredSession?.user) {
              console.log("Session restored after INITIAL_SESSION (attempt", attempt, ")");
              sessionCache.setCachedSession(restoredSession);
              setIsAuthenticated(true);
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem("supabase.auth.token", JSON.stringify(restoredSession));
                } catch (error) {
                  console.warn("Failed to store session in sessionStorage:", error);
                }
              }
            } else {
              // Try again
              checkSession(attempt + 1);
            }
          };

          checkSession();
        } else {
          // Session was restored immediately
          sessionCache.setCachedSession(session);
          setIsAuthenticated(true);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("supabase.auth.token", JSON.stringify(session));
            } catch (error) {
              console.warn("Failed to store session in sessionStorage:", error);
            }
          }
        }
        return;
      }

      // Update cache when auth state changes
      sessionCache.setCachedSession(session);

      // Check if we have a cached session before logging out
      // This prevents false negatives during initial session restoration
      const hasCachedSession = (() => {
        if (typeof window === "undefined") return false;
        try {
          const cached = sessionStorage.getItem("supabase.auth.token");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.user) {
              const now = Math.floor(Date.now() / 1000);
              return !parsed.expires_at || parsed.expires_at > now;
            }
          }
        } catch {
          return false;
        }
        return false;
      })();

      if (event === "SIGNED_OUT") {
        // Explicit sign out - always handle
        setIsAuthenticated(false);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("supabase.auth.token");
        }
        if (window.location.pathname !== "/auth") {
          router.push("/auth");
        }
      } else if (!session?.user) {
        // Check if we're past the initial restoration window (5 seconds) OR initial check is complete
        // Increased window to give Supabase more time to restore
        const timeSinceMount = Date.now() - mountTime;
        const pastInitialWindow = timeSinceMount > 5000 || initialCheckComplete;
        
        // Always check for cached session first - if we have one, keep user authenticated
        if (hasCachedSession) {
          // We have a cached session but Supabase says no session - this is likely a false negative
          // during initial load, so keep the user authenticated
          console.log("No session from Supabase but cached session exists - keeping authenticated");
          setIsAuthenticated(true);
          // Try to restore Supabase session in background
          setTimeout(async () => {
            if (!mounted) return;
            const { data: { session: backgroundSession } } = await supabase.auth.getSession();
            if (backgroundSession?.user) {
              sessionCache.setCachedSession(backgroundSession);
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem("supabase.auth.token", JSON.stringify(backgroundSession));
                } catch (error) {
                  console.warn("Failed to store session:", error);
                }
              }
            }
          }, 1000);
          return;
        }
        
        // Only log out if we have no session AND no cached session AND we're past initial window
        // This prevents false negatives during initial load when Supabase hasn't restored session yet
        if (pastInitialWindow && !hasCachedSession) {
          setIsAuthenticated(false);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("supabase.auth.token");
          }
          if (window.location.pathname !== "/auth") {
            router.push("/auth");
          }
        } else if (!pastInitialWindow && !hasCachedSession) {
          // Still in initial window and no cached session - wait a bit more
          console.log("No session during initial window, waiting for restoration...");
          // Don't change authentication state yet
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

    // Cleanup function - must be returned at the end
    return () => {
      mounted = false;
      if (sessionRestoreTimeout) {
        clearTimeout(sessionRestoreTimeout);
      }
      if (finallyBlockTimeout) {
        clearTimeout(finallyBlockTimeout);
      }
      if (maxWaitTimeout) {
        clearTimeout(maxWaitTimeout);
      }
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
          {/* Skip to main content link for accessibility */}
          <SkipLink href="#main-content" />
          
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
              <main id="main-content" className="h-full overflow-y-auto bg-muted/20" tabIndex={-1}>
                {/* Always render children - let components handle their own loading/access states */}
                {/* Apply small uniform padding for all pages except dispatch and chat (full-bleed) */}
                {pathname === "/dispatch" || pathname === "/chat" ? (
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
