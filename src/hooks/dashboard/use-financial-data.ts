
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CostsBreakdownProps } from "@/types/dashboard";
import { initialCostsBreakdown } from "@/data/dashboard/mock-data";

export function useFinancialData() {
  const [costsBreakdown, setCostsBreakdown] = useState<CostsBreakdownProps>(initialCostsBreakdown);

  // Fetch financial data (maintenance and fuel costs)
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["dashboard", "financial"],
    queryFn: async () => {
      try {
        // Get the current date and calculate date 30 days ago
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
        
        // Fetch maintenance costs for the last 30 days
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from("maintenance")
          .select("cost, date, description")
          .gte("date", formattedThirtyDaysAgo)
          .lte("date", formattedToday);
        
        if (maintenanceError) throw maintenanceError;
        
        // Fetch fuel costs for the last 30 days
        const { data: fuelData, error: fuelError } = await supabase
          .from("fuel_logs")
          .select("cost, date, fuel_type")
          .gte("date", formattedThirtyDaysAgo)
          .lte("date", formattedToday);
        
        if (fuelError) throw fuelError;
        
        // Calculate totals
        const totalMaintenanceCost = maintenanceData.reduce((sum, item) => sum + Number(item.cost), 0);
        const totalFuelCost = fuelData.reduce((sum, item) => sum + Number(item.cost), 0);
        const totalCost = totalMaintenanceCost + totalFuelCost;
        
        // Calculate fuel costs by type
        const fuelByType = fuelData.reduce((acc, item) => {
          const type = item.fuel_type || 'unknown';
          acc[type] = (acc[type] || 0) + Number(item.cost);
          return acc;
        }, {} as Record<string, number>);
        
        // Update costs breakdown state
        setCostsBreakdown({
          maintenance: {
            service: maintenanceData.filter(m => m.description?.toLowerCase().includes('service')).reduce((sum, item) => sum + Number(item.cost), 0),
            repairs: maintenanceData.filter(m => m.description?.toLowerCase().includes('repair')).reduce((sum, item) => sum + Number(item.cost), 0),
            total: totalMaintenanceCost
          },
          fuel: {
            diesel: fuelByType['diesel'] || 0,
            petrol: fuelByType['petrol'] || 0,
            total: totalFuelCost
          }
        });
        
        return {
          totalMaintenanceCost,
          totalFuelCost,
          totalCost,
          fuelByType
        };
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast.error("Failed to load financial data");
        return null;
      }
    },
  });

  return { financialData, isLoadingFinancial, costsBreakdown };
}
