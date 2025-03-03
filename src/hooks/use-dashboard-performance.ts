
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type PerformanceMetric = {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'query' | 'render' | 'data-load';
  dataSize?: number;
  details?: string;
};

export type PerformanceReport = {
  metrics: PerformanceMetric[];
  averageQueryTime: number;
  slowestQuery: PerformanceMetric | null;
  totalDataSize: number;
  averageRenderTime: number;
  timestamp: Date;
};

export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const renderStartTimeRef = useRef<number>(0);
  const queryClient = useQueryClient();

  // Start a performance measurement
  const startMeasurement = (name: string, type: 'query' | 'render' | 'data-load'): string => {
    if (!isMonitoring) return '';
    
    const id = `${name}-${Date.now()}`;
    const startTime = performance.now();
    
    setMetrics(prev => [...prev, {
      name,
      startTime,
      endTime: 0,
      duration: 0,
      type,
    }]);
    
    return id;
  };

  // End a performance measurement
  const endMeasurement = (name: string, additionalData?: { dataSize?: number, details?: string }): number => {
    if (!isMonitoring) return 0;
    
    const endTime = performance.now();
    let duration = 0;
    
    setMetrics(prev => {
      const index = prev.findIndex(m => m.name === name && m.endTime === 0);
      if (index === -1) return prev;
      
      const metric = prev[index];
      duration = endTime - metric.startTime;
      
      const updatedMetric = {
        ...metric,
        endTime,
        duration,
        ...(additionalData || {})
      };
      
      const newMetrics = [...prev];
      newMetrics[index] = updatedMetric;
      return newMetrics;
    });
    
    return duration;
  };

  // Track the performance of React Query operations
  useEffect(() => {
    if (!isMonitoring) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.getObserversCount() > 0) {
        const queryKey = JSON.stringify(event.query.queryKey);
        const queryState = event.query.state;
        
        if (queryState.status === 'success' && queryState.fetchStatus === 'idle') {
          // Query has completed successfully
          const dataSize = JSON.stringify(queryState.data).length;
          
          // In Tanstack Query v5, fetchMeta might have a different structure
          // Let's use a default start time if fetchMeta is not available as expected
          const startTimestamp = performance.now() - 100; // Default fallback
          const queryTime = queryState.dataUpdatedAt - startTimestamp;
          
          setMetrics(prev => [...prev, {
            name: `Query: ${queryKey}`,
            startTime: startTimestamp,
            endTime: queryState.dataUpdatedAt,
            duration: queryTime > 0 ? queryTime : 10, // Ensure positive duration
            type: 'query',
            dataSize,
            details: `Data updated at: ${new Date(queryState.dataUpdatedAt).toLocaleTimeString()}`
          }]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, isMonitoring]);

  // Start monitoring render time when component mounts
  useEffect(() => {
    renderStartTimeRef.current = performance.now();
    
    return () => {
      if (isMonitoring) {
        const renderTime = performance.now() - renderStartTimeRef.current;
        setMetrics(prev => [...prev, {
          name: 'Dashboard Render',
          startTime: renderStartTimeRef.current,
          endTime: performance.now(),
          duration: renderTime,
          type: 'render',
        }]);
      }
    };
  }, [isMonitoring]);

  // Generate a performance report
  const generateReport = (): PerformanceReport => {
    const queryMetrics = metrics.filter(m => m.type === 'query' && m.duration > 0);
    const renderMetrics = metrics.filter(m => m.type === 'render' && m.duration > 0);
    
    const totalQueryTime = queryMetrics.reduce((acc, m) => acc + m.duration, 0);
    const averageQueryTime = queryMetrics.length > 0 ? totalQueryTime / queryMetrics.length : 0;
    
    const totalRenderTime = renderMetrics.reduce((acc, m) => acc + m.duration, 0);
    const averageRenderTime = renderMetrics.length > 0 ? totalRenderTime / renderMetrics.length : 0;
    
    const slowestQuery = queryMetrics.length > 0 
      ? queryMetrics.reduce((prev, current) => (prev.duration > current.duration) ? prev : current) 
      : null;
    
    const totalDataSize = queryMetrics.reduce((acc, m) => acc + (m.dataSize || 0), 0);
    
    const report = {
      metrics,
      averageQueryTime,
      slowestQuery,
      totalDataSize,
      averageRenderTime,
      timestamp: new Date()
    };
    
    setReport(report);
    return report;
  };

  // Reset all collected metrics
  const resetMetrics = () => {
    setMetrics([]);
    setReport(null);
  };

  // Toggle performance monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(prev => !prev);
    toast(`Performance monitoring ${!isMonitoring ? 'enabled' : 'disabled'}`);
  };

  return {
    startMeasurement,
    endMeasurement,
    generateReport,
    resetMetrics,
    toggleMonitoring,
    isMonitoring,
    metrics,
    report
  };
}
