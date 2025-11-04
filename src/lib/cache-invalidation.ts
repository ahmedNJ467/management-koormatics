import { QueryClient } from "@tanstack/react-query";
import { sessionCache } from "./session-cache";

/**
 * Aggressive cache invalidation utility to ensure fresh data after updates
 */
export class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private queryClient: QueryClient | null = null;

  private constructor() {}

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Clear all caches and force fresh data fetch
   * Use this after major updates that need immediate visibility
   */
  async clearAllCaches(): Promise<void> {
    if (!this.queryClient) return;

    try {
      // Clear session cache first
      sessionCache.clearCache();

      // Clear all React Query caches
      this.queryClient.clear();

      // Clear browser caches if available
      if (typeof window !== "undefined") {
        // Clear sessionStorage (but preserve auth tokens)
        try {
          const authToken = sessionStorage.getItem("supabase.auth.token");
          sessionStorage.clear();
          if (authToken) {
            sessionStorage.setItem("supabase.auth.token", authToken);
          }
        } catch (e) {
          console.warn("Failed to clear sessionStorage:", e);
        }

        // Clear service worker caches
        if ("serviceWorker" in navigator) {
          try {
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          } catch (e) {
            console.warn("Failed to clear service workers:", e);
          }
        }

        // Clear browser caches
        if ("caches" in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          } catch (e) {
            console.warn("Failed to clear browser caches:", e);
          }
        }
      }

      console.log("All caches cleared successfully");
    } catch (error) {
      console.error("Error clearing caches:", error);
    }
  }

  /**
   * Invalidate specific query keys and refetch immediately
   * This ensures data is fresh after mutations
   */
  async invalidateAndRefetch(queryKeys: string[][]): Promise<void> {
    if (!this.queryClient) return;

    try {
      // Mark that updates have occurred
      this.markRecentUpdates();

      // Remove cached data for these queries to force fresh fetch
      queryKeys.forEach((key) => {
        this.queryClient!.removeQueries({ queryKey: key });
      });

      // Invalidate queries (marks them as stale)
      await Promise.all(
        queryKeys.map((key) =>
          this.queryClient!.invalidateQueries({ 
            queryKey: key,
            refetchType: 'active' // Only refetch active queries
          })
        )
      );

      // Force immediate refetch regardless of stale time
      await Promise.all(
        queryKeys.map((key) =>
          this.queryClient!.refetchQueries({ 
            queryKey: key,
            type: 'active' // Only refetch active queries
          })
        )
      );

      console.log("Queries invalidated and refetched:", queryKeys);
    } catch (error) {
      console.error("Error invalidating queries:", error);
    }
  }

  /**
   * Force refresh critical data after authentication changes
   */
  async refreshAuthData(): Promise<void> {
    await this.invalidateAndRefetch([
      ["page_access"],
      ["user_roles"],
      ["user_profile"],
      ["auth_session"],
    ]);
  }

  /**
   * Force refresh data after major operations (trips, vehicles, etc.)
   */
  async refreshCoreData(): Promise<void> {
    await this.invalidateAndRefetch([
      ["trips"],
      ["vehicles"],
      ["drivers"],
      ["clients"],
      ["maintenance"],
      ["fuel_logs"],
    ]);
  }

  /**
   * Setup automatic cache clearing on page unload for critical updates
   */
  setupAutoClearOnUnload(): void {
    if (typeof window === "undefined") return;

    // Clear caches when page is about to unload (after updates)
    window.addEventListener("beforeunload", () => {
      // Only clear if there were recent updates
      const hasRecentUpdates = sessionStorage.getItem("has_recent_updates");
      if (hasRecentUpdates) {
        sessionCache.clearCache();
        sessionStorage.removeItem("has_recent_updates");
      }
    });
  }

  /**
   * Mark that recent updates have occurred
   */
  markRecentUpdates(): void {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("has_recent_updates", "true");
      sessionStorage.setItem("last_update_time", Date.now().toString());
    }
  }

  /**
   * Force a complete page refresh with cache clearing
   * Use as last resort when other methods don't work
   */
  forcePageRefresh(): void {
    if (typeof window !== "undefined") {
      // Clear all caches
      this.clearAllCaches();

      // Force reload with cache bypass
      window.location.reload();
    }
  }
}

// Export singleton instance
export const cacheInvalidationManager = CacheInvalidationManager.getInstance();
