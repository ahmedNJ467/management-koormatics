
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { addDays, subDays, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { Trip, TripType } from "@/lib/types";

// Helper function to get date range based on timeRange
export const getDateRangeFromTimeRange = (timeRange: string) => {
  const today = new Date();
  
  switch (timeRange) {
    case "7days":
      return {
        from: subDays(today, 7),
        to: today
      };
    case "30days":
      return {
        from: subDays(today, 30),
        to: today
      };
    case "thisMonth":
      return {
        from: startOfMonth(today),
        to: today
      };
    case "lastMonth":
      const lastMonth = subDays(startOfMonth(today), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    default:
      return {
        from: subDays(today, 30),
        to: today
      };
  }
};

// Hook for fetching vehicles data
export const useVehiclesData = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*');

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching vehicles data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};

// Hook for fetching fuel data
export const useFuelData = (timeRange: string, dateRange: DateRange | undefined) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let effectiveDateRange = dateRange;
        
        if (!effectiveDateRange?.from) {
          effectiveDateRange = getDateRangeFromTimeRange(timeRange);
        }

        const fromDate = effectiveDateRange.from;
        const toDate = effectiveDateRange.to || effectiveDateRange.from;

        const { data, error } = await supabase
          .from('fuel_logs')
          .select('*, vehicles(make, model, registration)')
          .gte('date', fromDate.toISOString().split('T')[0])
          .lte('date', toDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching fuel data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, dateRange]);

  return { data, isLoading, error };
};

// Hook for fetching maintenance data
export const useMaintenanceData = (timeRange: string, dateRange: DateRange | undefined) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let effectiveDateRange = dateRange;
        
        if (!effectiveDateRange?.from) {
          effectiveDateRange = getDateRangeFromTimeRange(timeRange);
        }

        const fromDate = effectiveDateRange.from;
        const toDate = effectiveDateRange.to || effectiveDateRange.from;

        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(make, model, registration)')
          .gte('date', fromDate.toISOString().split('T')[0])
          .lte('date', toDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching maintenance data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, dateRange]);

  return { data, isLoading, error };
};

// Hook for fetching trips data
export const useTripsData = (timeRange: string, dateRange: DateRange | undefined) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let effectiveDateRange = dateRange;
        
        if (!effectiveDateRange?.from) {
          effectiveDateRange = getDateRangeFromTimeRange(timeRange);
        }

        const fromDate = effectiveDateRange.from;
        const toDate = effectiveDateRange.to || effectiveDateRange.from;

        const { data, error } = await supabase
          .from('trips')
          .select('*, vehicles(*), drivers(*), clients(name)')
          .gte('date', fromDate.toISOString().split('T')[0])
          .lte('date', toDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching trips data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, dateRange]);

  return { data, isLoading, error };
};

// Hook for fetching drivers data
export const useDriversData = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('drivers')
          .select('*');

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching drivers data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};
