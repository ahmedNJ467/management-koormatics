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
            staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh longer
            gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
            retry: 1,
            refetchOnWindowFocus: false, // Don't refetch on focus - use cache
            refetchOnMount: false, // Don't refetch on mount - use cache for instant loading
            refetchOnReconnect: true,
            placeholderData: (previousData: any) => previousData, // Show cached data immediately
            retryOnMount: false, // Don't retry on mount - use cache
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
