
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CostData,
  MonthlyData,
  VehicleCostData,
  CategoryData,
  YearComparisonData
} from "@/lib/types/cost-analytics";

export function useCostAnalyticsData(selectedYear: string) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [comparisonYear, setComparisonYear] = useState<string | null>(null);
  
  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Fetch maintenance costs for selected year
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenanceCosts', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('cost, description, date, vehicle_id, vehicles(make, model, registration)')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching maintenance data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch fuel costs for selected year
  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ['fuelCosts', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('cost, fuel_type, date, vehicle_id, vehicles(make, model, registration)')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching fuel data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch comparison year data when needed
  const { 
    data: comparisonMaintenanceData, 
    isLoading: comparisonMaintenanceLoading 
  } = useQuery({
    queryKey: ['maintenanceCosts', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      const { data, error } = await supabase
        .from('maintenance')
        .select('cost, description, date, vehicle_id, vehicles(make, model, registration)')
        .gte('date', `${comparisonYear}-01-01`)
        .lte('date', `${comparisonYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching comparison maintenance data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!comparisonYear,
  });

  const { 
    data: comparisonFuelData, 
    isLoading: comparisonFuelLoading 
  } = useQuery({
    queryKey: ['fuelCosts', comparisonYear],
    queryFn: async () => {
      if (!comparisonYear) return [];
      
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('cost, fuel_type, date, vehicle_id, vehicles(make, model, registration)')
        .gte('date', `${comparisonYear}-01-01`)
        .lte('date', `${comparisonYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching comparison fuel data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!comparisonYear,
  });

  const isLoading = maintenanceLoading || fuelLoading || 
    (!!comparisonYear && (comparisonMaintenanceLoading || comparisonFuelLoading));

  return {
    maintenanceData,
    fuelData,
    comparisonMaintenanceData,
    comparisonFuelData,
    isLoading,
    yearOptions,
    comparisonYear,
    setComparisonYear
  };
}
