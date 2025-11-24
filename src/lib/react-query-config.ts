import { QueryClient } from "@tanstack/react-query";

/**
 * Optimized React Query configuration
 * - Better default stale times
 * - Optimized cache management
 * - Reduced unnecessary refetches
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Data stays in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Don't refetch on window focus (reduces unnecessary requests)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect immediately
      refetchOnReconnect: true,
      // Retry failed requests once
      retry: 1,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
};

/**
 * Create a new QueryClient with optimized settings
 */
export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

