"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/loading-states";
import { cn } from "@/lib/utils";

interface ChartWrapperProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  height?: string;
  emptyMessage?: string;
  hasData?: boolean;
}

/**
 * Wrapper component for charts with loading, error, and empty states
 * Optimizes chart rendering and provides consistent UX
 */
export function ChartWrapper({
  children,
  isLoading,
  error,
  className,
  height = "400px",
  emptyMessage = "No data available",
  hasData = true,
}: ChartWrapperProps) {
  if (isLoading) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Failed to load chart</p>
          <p className="text-xs">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ minHeight: height }}>
      {children}
    </div>
  );
}

/**
 * Create a dynamically imported chart with optimized loading
 */
export function createOptimizedChart<T = {}>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options?: {
    height?: string;
    emptyMessage?: string;
  }
) {
  return dynamic(importFn, {
    ssr: false,
    loading: () => (
      <ChartWrapper
        isLoading={true}
        height={options?.height}
        emptyMessage={options?.emptyMessage}
        children={null}
      />
    ),
  });
}

/**
 * Hook to optimize chart data processing
 */
export function useChartData<T, R>(
  data: T[] | undefined,
  processor: (data: T[]) => R,
  dependencies: React.DependencyList = []
): R | null {
  return React.useMemo(() => {
    if (!data || data.length === 0) return null;
    return processor(data);
  }, [data, ...dependencies]);
}

