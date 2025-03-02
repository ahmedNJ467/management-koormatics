
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { TripType, tripTypeDisplayMap } from "@/lib/types/trip";
import { extractFlightInfo } from "../utils/export-utils";

export const useVehiclesData = () => {
  return useQuery({
    queryKey: ["vehicles-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, maintenance(cost, date, description)");

      if (error) throw error;
      return data;
    },
  });
};

export const useFuelData = (timeRange: string, dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["fuel-report", timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("fuel_logs")
        .select("*, vehicles(make, model)");

      if (dateRange && dateRange.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte("date", fromDate);
        
        if (dateRange.to) {
          const toDate = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte("date", toDate);
        }
      } else if (timeRange !== "all") {
        let timeFilter = new Date();
        if (timeRange === "month") {
          timeFilter.setMonth(timeFilter.getMonth() - 1);
        } else if (timeRange === "quarter") {
          timeFilter.setMonth(timeFilter.getMonth() - 3);
        } else if (timeRange === "year") {
          timeFilter.setFullYear(timeFilter.getFullYear() - 1);
        }
        query = query.gte("date", timeFilter.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMaintenanceData = (timeRange: string, dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["maintenance-report", timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("maintenance")
        .select("*, vehicles(make, model)");

      if (dateRange && dateRange.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte("date", fromDate);
        
        if (dateRange.to) {
          const toDate = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte("date", toDate);
        }
      } else if (timeRange !== "all") {
        let timeFilter = new Date();
        if (timeRange === "month") {
          timeFilter.setMonth(timeFilter.getMonth() - 1);
        } else if (timeRange === "quarter") {
          timeFilter.setMonth(timeFilter.getMonth() - 3);
        } else if (timeRange === "year") {
          timeFilter.setFullYear(timeFilter.getFullYear() - 1);
        }
        query = query.gte("date", timeFilter.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useTripsData = (timeRange: string, dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["trips-report", timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select(`
          *,
          vehicles(make, model),
          drivers(name),
          clients(name)
        `);

      if (dateRange && dateRange.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte("date", fromDate);
        
        if (dateRange.to) {
          const toDate = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte("date", toDate);
        }
      } else if (timeRange !== "all") {
        let timeFilter = new Date();
        if (timeRange === "month") {
          timeFilter.setMonth(timeFilter.getMonth() - 1);
        } else if (timeRange === "quarter") {
          timeFilter.setMonth(timeFilter.getMonth() - 3);
        } else if (timeRange === "year") {
          timeFilter.setFullYear(timeFilter.getFullYear() - 1);
        }
        query = query.gte("date", timeFilter.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(trip => {
        const flightInfo = extractFlightInfo(trip.notes || '');
        
        const displayType = tripTypeDisplayMap[trip.type as TripType] || trip.type;
        
        return {
          ...trip,
          flight_info: flightInfo,
          display_type: displayType
        };
      });
    },
  });
};

export const useDriversData = () => {
  return useQuery({
    queryKey: ["drivers-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*");

      if (error) throw error;
      return data;
    },
  });
};
