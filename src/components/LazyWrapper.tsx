"use client";

import { Suspense, lazy, ComponentType } from "react";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => null;

export function LazyWrapper({
  children,
  fallback = <DefaultFallback />,
}: LazyWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

// Lazy load heavy components
export const LazyPerformanceMetricsChart = lazy(() =>
  import("./dashboard/charts/PerformanceMetricsChart").then((module) => ({
    default: module.PerformanceMetricsChart,
  }))
);

export const LazyFuelConsumptionChart = lazy(() =>
  import("./dashboard/charts/FuelConsumptionChart").then((module) => ({
    default: module.FuelConsumptionChart,
  }))
);

export const LazyMaintenanceCostsChart = lazy(() =>
  import("./dashboard/charts/MaintenanceCostsChart").then((module) => ({
    default: module.MaintenanceCostsChart,
  }))
);

export const LazyRecentActivity = lazy(() =>
  import("./dashboard/RecentActivity").then((module) => ({
    default: module.RecentActivity,
  }))
);

export const LazyRecentTrips = lazy(() => import("./dashboard/RecentTrips"));
