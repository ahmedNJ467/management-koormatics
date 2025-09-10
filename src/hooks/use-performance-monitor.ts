import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - startTime.current;

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${componentName} loaded in ${loadTime}ms`);

      // Monitor memory usage if available
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        console.log(
          `💾 Memory usage: ${Math.round(
            memory.usedJSHeapSize / 1024 / 1024
          )}MB`
        );
      }
    }

    // Track Core Web Vitals
    if (typeof window !== "undefined" && "performance" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log(
              `📊 Navigation timing: ${
                navEntry.loadEventEnd - navEntry.loadEventStart
              }ms`
            );
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });

      return () => observer.disconnect();
    }
  }, [componentName]);

  const markRenderStart = () => {
    renderStartTime.current = Date.now();
  };

  const markRenderEnd = () => {
    const renderTime = Date.now() - renderStartTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(`🎨 ${componentName} rendered in ${renderTime}ms`);
    }
  };

  return { markRenderStart, markRenderEnd };
}

// Hook for monitoring query performance
export function useQueryPerformance(queryKey: string[]) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const queryTime = Date.now() - startTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Query ${queryKey.join(".")} completed in ${queryTime}ms`);
    }
  }, [queryKey]);

  return { startTime: startTime.current };
}
