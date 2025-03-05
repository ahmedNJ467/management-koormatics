
import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

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
          v.status === 'inactive' || v.status === 'sold' || v.status === 'retired'
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
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none'
          }}
        />
        <Bar dataKey="active" stackId="a" fill="#4ade80" name="Active Vehicles" radius={[4, 4, 0, 0]} />
        <Bar dataKey="maintenance" stackId="a" fill="#facc15" name="In Maintenance" radius={[4, 4, 0, 0]} />
        <Bar dataKey="inactive" stackId="a" fill="#f87171" name="Inactive" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
