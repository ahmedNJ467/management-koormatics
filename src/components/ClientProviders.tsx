"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ReactNode } from "react";
import { cacheInvalidationManager } from "@/lib/cache-invalidation";

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Always consider data stale - force refetch after mutations
            gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for shorter time
            retry: 1,
            refetchOnWindowFocus: true, // Refetch on focus to get latest data
            refetchOnMount: true, // Always refetch on mount to ensure fresh data
            refetchOnReconnect: true,
            placeholderData: (previousData: any) => previousData, // Show cached data immediately while fetching
            retryOnMount: false, // Don't retry on mount - use cache
            retryDelay: 1000,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
            // Automatically mark updates after any successful mutation
            onSuccess: () => {
              // Mark that updates have occurred for cache clearing on refresh
              if (typeof window !== "undefined") {
                sessionStorage.setItem("has_recent_updates", "true");
                sessionStorage.setItem("last_update_time", Date.now().toString());
              }
            },
          },
        },
      })
  );

  // Initialize cache invalidation manager
  useEffect(() => {
    cacheInvalidationManager.setQueryClient(queryClient);
    cacheInvalidationManager.setupAutoClearOnUnload();

    // Check for recent updates on mount and clear stale cache BEFORE any queries run
    // This MUST run synchronously in the useEffect to clear cache before queries execute
    if (typeof window !== "undefined") {
      const hasRecentUpdates = sessionStorage.getItem("has_recent_updates");
      const lastUpdateTime = sessionStorage.getItem("last_update_time");
      
      if (hasRecentUpdates || lastUpdateTime) {
        // Clear all React Query cache immediately
        queryClient.clear();
        
        // Also clear browser caches if available (async but fire and forget)
        if ("caches" in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((name) => {
              caches.delete(name).catch(() => {});
            });
          }).catch(() => {});
        }
        
        // Remove the flags after clearing
        sessionStorage.removeItem("has_recent_updates");
        sessionStorage.removeItem("last_update_time");
        
        console.log("Cache cleared due to recent updates detected - fresh data will be fetched");
      }
    }
  }, [queryClient]);

  // On build change, clear caches and unregister service workers to avoid stale assets
  useEffect(() => {
    (async () => {
      try {
        const buildId =
          (typeof window !== "undefined" &&
            (window as any).__NEXT_DATA__?.buildId) ||
          process.env.NEXT_PUBLIC_APP_VERSION ||
          "dev";
        const versionKey = "koormatics-build-id";

        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(versionKey)
            : null;

        if (!stored || stored !== buildId) {
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }

          if ("caches" in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }

          try {
            sessionStorage.clear();
          } catch {
            // Ignore sessionStorage clear errors
          }

          window.localStorage.setItem(versionKey, String(buildId));
          window.location.reload();
        }
      } catch (e) {
        console.warn("Build change cleanup failed", e);
      }
    })();
  }, []);

  // Prevent CSS files from being executed as scripts (client-side safeguard)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Monitor for script execution errors related to CSS
    const originalError = window.console.error;
    window.console.error = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Refused to execute script") &&
        message.includes(".css")
      ) {
        console.warn(
          "CSS MIME type error detected. This is usually caused by:",
          "1. Browser cache - Clear cache and hard refresh (Ctrl+Shift+R)",
          "2. Service worker - Unregister in DevTools → Application",
          "3. Browser extension - Disable extensions temporarily"
        );
      }
      originalError.apply(window.console, args);
    };

    return () => {
      window.console.error = originalError;
    };
  }, []);

  // Only clear critical auth caches on page load - keep data caches for instant loading
  useEffect(() => {
    (async () => {
      try {
        // Only clear service workers if they exist
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }

        // Clear only auth-related queries on page load for fresh authentication state
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ["page_access"] });
          queryClient.invalidateQueries({ queryKey: ["user_roles"] });
          queryClient.invalidateQueries({ queryKey: ["auth_session"] });
        }

        console.log("Auth caches cleared, data caches preserved for instant loading");
      } catch (error) {
        console.warn("Cache clearing failed:", error);
      }
    })();
  }, [queryClient]);

  // Add a beforeunload handler to ensure cache is marked before page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If there are recent updates, ensure they're persisted
      const hasRecentUpdates = sessionStorage.getItem("has_recent_updates");
      if (hasRecentUpdates) {
        // Keep the flag so it's detected on next page load
        sessionStorage.setItem("has_recent_updates", "true");
        sessionStorage.setItem("last_update_time", Date.now().toString());
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="koormatics-theme"
      >
        <TooltipProvider>
          {/* Inject meta tags with build info (helps some proxies treat HTML as changed) */}
          <meta
            name="x-next-build-id"
            content={
              (typeof window !== "undefined" &&
                (window as any).__NEXT_DATA__?.buildId) ||
              process.env.NEXT_PUBLIC_APP_VERSION ||
              "dev"
            }
          />
          <Toaster />
          <Sonner />
          <ErrorBoundary>{children}</ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
