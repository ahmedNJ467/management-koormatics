import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCostAnalyticsData(selectedYear: string) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [comparisonYear, setComparisonYear] = useState<string | null>(null);
  
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    if (comparisonYear === selectedYear) {
      setComparisonYear(null);
    }
  }, [selectedYear, comparisonYear]);

  const { data: maintenanceData, isLoading: maintenanceLoading, error: maintenanceError } = useQuery({
    queryKey: ['maintenanceCosts', selectedYear],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('cost, description, date, vehicle_id, status, vehicles(make, model, registration)')
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);
        
        if (error) {
          console.error("Maintenance data fetch error:", error);
          toast({
            title: "Error fetching maintenance data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        console.log("Fetched maintenance data:", data);
        return data || [];
      } catch (error) {
        console.error("Error fetching maintenance data:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: fuelData, isLoading: fuelLoading, error: fuelError } = useQuery({
    queryKey: ['fuelCosts', selectedYear],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_logs')
          .select('cost, fuel_type, date, vehicle_id, vehicles(make, model, registration)')
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);
        
        if (error) {
          console.error("Fuel data fetch error:", error);
          toast({
            title: "Error fetching fuel data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching fuel data:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ['tripsRevenue', selectedYear],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('id, amount, date, status, vehicle_id, vehicles(make, model, registration)')
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`)
          .in('status', ['completed', 'paid']);
        
        if (error) {
          console.error("Trips data fetch error:", error);
          toast({
            title: "Error fetching trips data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching trips data:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sparePartsData, isLoading: sparePartsLoading, error: sparePartsError } = useQuery({
    queryKey: ['sparePartsCosts', selectedYear],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('spare_parts')
          .select('*')
          .gt('quantity_used', 0)
          .or(`purchase_date.gte.${selectedYear}-01-01,last_used_date.gte.${selectedYear}-01-01`)
          .or(`purchase_date.lte.${selectedYear}-12-31,last_used_date.lte.${selectedYear}-12-31`);
        
        if (error) {
          console.error("Spare parts data fetch error:", error);
          toast({
            title: "Error fetching spare parts data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching spare parts data:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: comparisonMaintenanceData, 
    isLoading: comparisonMaintenanceLoading,
    error: comparisonMaintenanceError 
  } = useQuery({
    queryKey: ['maintenanceCosts', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('cost, description, date, vehicle_id, status, vehicles(make, model, registration)')
          .gte('date', `${comparisonYear}-01-01`)
          .lte('date', `${comparisonYear}-12-31`);
        
        if (error) {
          console.error("Comparison maintenance data fetch error:", error);
          toast({
            title: "Error fetching comparison maintenance data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching comparison maintenance data:", error);
        return [];
      }
    },
    enabled: !!comparisonYear,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: comparisonFuelData, 
    isLoading: comparisonFuelLoading,
    error: comparisonFuelError 
  } = useQuery({
    queryKey: ['fuelCosts', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      try {
        const { data, error } = await supabase
          .from('fuel_logs')
          .select('cost, fuel_type, date, vehicle_id, vehicles(make, model, registration)')
          .gte('date', `${comparisonYear}-01-01`)
          .lte('date', `${comparisonYear}-12-31`);
        
        if (error) {
          console.error("Comparison fuel data fetch error:", error);
          toast({
            title: "Error fetching comparison fuel data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching comparison fuel data:", error);
        return [];
      }
    },
    enabled: !!comparisonYear,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: comparisonTripsData, 
    isLoading: comparisonTripsLoading,
    error: comparisonTripsError 
  } = useQuery({
    queryKey: ['tripsRevenue', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('id, amount, date, status, vehicle_id, vehicles(make, model, registration)')
          .gte('date', `${comparisonYear}-01-01`)
          .lte('date', `${comparisonYear}-12-31`)
          .in('status', ['completed', 'paid']);
        
        if (error) {
          console.error("Comparison trips data fetch error:", error);
          toast({
            title: "Error fetching comparison trips data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching comparison trips data:", error);
        return [];
      }
    },
    enabled: !!comparisonYear,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: comparisonSparePartsData, 
    isLoading: comparisonSparePartsLoading,
    error: comparisonSparePartsError 
  } = useQuery({
    queryKey: ['sparePartsCosts', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      try {
        const { data, error } = await supabase
          .from('spare_parts')
          .select('*')
          .gt('quantity_used', 0)
          .or(`purchase_date.gte.${comparisonYear}-01-01,last_used_date.gte.${comparisonYear}-01-01`)
          .or(`purchase_date.lte.${comparisonYear}-12-31,last_used_date.lte.${comparisonYear}-12-31`);
        
        if (error) {
          console.error("Comparison spare parts data fetch error:", error);
          toast({
            title: "Error fetching comparison spare parts data",
            description: error.message,
            variant: "destructive",
          });
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching comparison spare parts data:", error);
        return [];
      }
    },
    enabled: !!comparisonYear,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (maintenanceError) console.error("Maintenance query error:", maintenanceError);
    if (fuelError) console.error("Fuel query error:", fuelError);
    if (tripsError) console.error("Trips query error:", tripsError);
    if (sparePartsError) console.error("Spare parts query error:", sparePartsError);
    if (comparisonMaintenanceError) console.error("Comparison maintenance query error:", comparisonMaintenanceError);
    if (comparisonFuelError) console.error("Comparison fuel query error:", comparisonFuelError);
    if (comparisonTripsError) console.error("Comparison trips query error:", comparisonTripsError);
    if (comparisonSparePartsError) console.error("Comparison spare parts query error:", comparisonSparePartsError);
  }, [maintenanceError, fuelError, tripsError, sparePartsError, comparisonMaintenanceError, comparisonFuelError, comparisonTripsError, comparisonSparePartsError]);

  const isLoading = maintenanceLoading || fuelLoading || tripsLoading || sparePartsLoading || 
    (!!comparisonYear && (comparisonMaintenanceLoading || comparisonFuelLoading || comparisonTripsLoading || comparisonSparePartsLoading));

  return {
    maintenanceData: maintenanceData || [],
    fuelData: fuelData || [],
    tripsData: tripsData || [],
    sparePartsData: sparePartsData || [],
    comparisonMaintenanceData: comparisonMaintenanceData || [],
    comparisonFuelData: comparisonFuelData || [],
    comparisonTripsData: comparisonTripsData || [],
    comparisonSparePartsData: comparisonSparePartsData || [],
    isLoading,
    yearOptions,
    comparisonYear,
    setComparisonYear
  };
}
