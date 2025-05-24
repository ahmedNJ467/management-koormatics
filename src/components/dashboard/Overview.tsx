
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

const chartConfig = {
  active: {
    label: "Active Vehicles",
    color: "hsl(var(--chart-1))",
  },
  maintenance: {
    label: "In Maintenance",
    color: "hsl(var(--chart-2))",
  },
  inactive: {
    label: "Inactive",
    color: "hsl(var(--chart-3))",
  },
};

export const Overview = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const months = eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  }).map(date => format(date, 'MMM'));

  const { data, isLoading, error } = useQuery({
    queryKey: ["fleet-overview", year],
    queryFn: async () => {
      // Fetch vehicles data to calculate status by month
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, status, created_at, updated_at");
      
      if (vehiclesError) throw vehiclesError;

      // Fetch maintenance data to track vehicles in maintenance
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("vehicle_id, date, status")
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`);
      
      if (maintenanceError) throw maintenanceError;

      // Process the data for the chart by month
      const monthlyData = months.map((month, index) => {
        const monthStart = startOfMonth(new Date(year, index, 1));
        const monthEnd = endOfMonth(new Date(year, index, 1));
        
        // Filter maintenance records for this month
        const monthlyMaintenance = maintenanceData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= monthStart && itemDate <= monthEnd && item.status === 'in_progress';
        });
        
        // Count vehicles in different statuses
        const uniqueVehiclesInMaintenance = [...new Set(monthlyMaintenance.map(m => m.vehicle_id))];
        
        const activeVehicles = vehicles.filter(v => 
          v.status === 'active' && 
          !uniqueVehiclesInMaintenance.includes(v.id)
        ).length;
        
        const inactiveVehicles = vehicles.filter(v => 
          v.status === 'inactive'
        ).length;
        
        return {
          name: month,
          active: activeVehicles,
          maintenance: uniqueVehiclesInMaintenance.length,
          inactive: inactiveVehicles
        };
      });

      return monthlyData;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[350px] text-red-500">
        Error loading fleet data
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis 
          dataKey="name" 
          className="text-muted-foreground text-sm"
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          className="text-muted-foreground text-sm"
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
        />
        <Bar 
          dataKey="active" 
          stackId="a" 
          fill="var(--color-active)"
          name="Active Vehicles" 
          radius={[0, 0, 0, 0]} 
        />
        <Bar 
          dataKey="maintenance" 
          stackId="a" 
          fill="var(--color-maintenance)"
          name="In Maintenance" 
          radius={[0, 0, 0, 0]} 
        />
        <Bar 
          dataKey="inactive" 
          stackId="a" 
          fill="var(--color-inactive)"
          name="Inactive" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ChartContainer>
  );
};
