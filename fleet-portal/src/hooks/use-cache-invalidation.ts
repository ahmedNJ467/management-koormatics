import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cacheInvalidationManager } from "@/lib/cache-invalidation";

/**
 * Hook for cache invalidation operations
 * Use this in components that need to ensure fresh data after updates
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const clearAllCaches = useCallback(async () => {
    await cacheInvalidationManager.clearAllCaches();
  }, []);

  const invalidateAndRefetch = useCallback(async (queryKeys: string[][]) => {
    await cacheInvalidationManager.invalidateAndRefetch(queryKeys);
  }, []);

  const refreshAuthData = useCallback(async () => {
    await cacheInvalidationManager.refreshAuthData();
  }, []);

  const refreshCoreData = useCallback(async () => {
    await cacheInvalidationManager.refreshCoreData();
  }, []);

  const markRecentUpdates = useCallback(() => {
    cacheInvalidationManager.markRecentUpdates();
  }, []);

  const forcePageRefresh = useCallback(() => {
    cacheInvalidationManager.forcePageRefresh();
  }, []);

  const invalidateSpecificQueries = useCallback(
    (queryKeys: string[][]) => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    [queryClient]
  );

  const refetchSpecificQueries = useCallback(
    (queryKeys: string[][]) => {
      queryKeys.forEach((key) => {
        queryClient.refetchQueries({ queryKey: key });
      });
    },
    [queryClient]
  );

  return {
    clearAllCaches,
    invalidateAndRefetch,
    refreshAuthData,
    refreshCoreData,
    markRecentUpdates,
    forcePageRefresh,
    invalidateSpecificQueries,
    refetchSpecificQueries,
  };
}
