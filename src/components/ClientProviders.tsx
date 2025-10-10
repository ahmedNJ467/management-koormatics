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
            staleTime: 5 * 1000, // 5 seconds for very fresh lists across pages
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: true, // Always refetch on focus for fresh data
            refetchOnMount: true, // Always refetch on mount for fresh data
            refetchOnReconnect: true,
            placeholderData: (previousData: any) => previousData, // Smooth pagination and list refreshes
            retryOnMount: true,
            retryDelay: 1000,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  // Initialize cache invalidation manager
  useEffect(() => {
    cacheInvalidationManager.setQueryClient(queryClient);
    cacheInvalidationManager.setupAutoClearOnUnload();
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
          } catch {}

          window.localStorage.setItem(versionKey, String(buildId));
          window.location.reload();
        }
      } catch (e) {
        console.warn("Build change cleanup failed", e);
      }
    })();
  }, []);

  // Clear caches on page load to ensure fresh data (both dev and prod)
  useEffect(() => {
    (async () => {
      try {
        // Always clear browser caches to ensure fresh data
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }

        // Clear React Query cache on page load for critical data
        if (queryClient) {
          // Clear auth-related queries to ensure fresh authentication state
          queryClient.invalidateQueries({ queryKey: ["page_access"] });
          queryClient.invalidateQueries({ queryKey: ["user_roles"] });
          queryClient.invalidateQueries({ queryKey: ["auth_session"] });
        }

        console.log("Caches cleared on page load for fresh data");
      } catch (error) {
        console.warn("Cache clearing failed:", error);
      }
    })();
  }, [queryClient]);

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
