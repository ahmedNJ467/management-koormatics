"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
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

  // In development, aggressively clear caches on every load to avoid stale UI
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (async () => {
        try {
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          if ("caches" in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }
        } catch {}
      })();
    }
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
