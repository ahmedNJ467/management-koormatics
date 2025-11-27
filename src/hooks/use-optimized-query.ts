import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { QueryKey } from "@tanstack/react-query";

/**
 * Optimized query hook with better defaults for performance
 * - Stale time: 5 minutes (data considered fresh)
 * - Cache time: 30 minutes (data kept in cache)
 * - Refetch on window focus: false (reduces unnecessary requests)
 * - Retry: 1 (faster failure on network errors)
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, "staleTime" | "cacheTime" | "refetchOnWindowFocus" | "retry">
) {
  return useQuery<TData, TError>({
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}

/**
 * Hook for queries that should be refetched more frequently
 * Useful for real-time data that changes often
 */
export function useFrequentQuery<TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, "staleTime" | "cacheTime" | "refetchOnWindowFocus" | "retry">
) {
  return useQuery<TData, TError>({
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
      });
}

/**
 * Hook for queries that rarely change
 * Useful for reference data, settings, etc.
 */
export function useStableQuery<TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, "staleTime" | "cacheTime" | "refetchOnWindowFocus" | "retry">
) {
  return useQuery<TData, TError>({
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}
