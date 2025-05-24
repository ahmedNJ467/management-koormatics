
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts";
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

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
          inactive: inactiveVehicles,
          total: activeVehicles + uniqueVehiclesInMaintenance.length + inactiveVehicles
        };
      });

      return monthlyData;
    }
  });

  // Calculate summary statistics
  const currentMonth = data?.[new Date().getMonth()];
  const previousMonth = data?.[new Date().getMonth() - 1];
  const activeChange = currentMonth && previousMonth 
    ? ((currentMonth.active - previousMonth.active) / previousMonth.active) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-red-500 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Error loading fleet data</div>
          <div className="text-sm text-red-600">Please try refreshing the page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
            Fleet Overview
          </h2>
          <p className="text-muted-foreground mt-1">
            Vehicle status and utilization for {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year - 1)}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {year - 1}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year + 1)}
            disabled={year >= new Date().getFullYear()}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {year + 1}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Vehicles</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {currentMonth?.active || 0}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {activeChange > 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-600" />
              )}
              <span className={activeChange > 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(activeChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">In Maintenance</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                {currentMonth?.maintenance || 0}
              </p>
            </div>
            <div className="w-8 h-8 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inactive</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {currentMonth?.inactive || 0}
              </p>
            </div>
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Monthly Fleet Status</h3>
          <p className="text-sm text-muted-foreground">
            Track your fleet status throughout the year
          </p>
        </div>
        
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted/20" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              className="text-muted-foreground text-sm"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              className="text-muted-foreground text-sm"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              dx={-10}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)', radius: 4 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="active" 
              stackId="fleet" 
              fill="var(--color-active)"
              name="Active Vehicles" 
              radius={[0, 0, 0, 0]}
              className="drop-shadow-sm"
            />
            <Bar 
              dataKey="maintenance" 
              stackId="fleet" 
              fill="var(--color-maintenance)"
              name="In Maintenance" 
              radius={[0, 0, 0, 0]}
              className="drop-shadow-sm"
            />
            <Bar 
              dataKey="inactive" 
              stackId="fleet" 
              fill="var(--color-inactive)"
              name="Inactive" 
              radius={[6, 6, 0, 0]}
              className="drop-shadow-sm"
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};
