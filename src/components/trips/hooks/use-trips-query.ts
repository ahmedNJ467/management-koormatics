
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip, Trip, serviceTypeDisplayMap } from "@/lib/types";
import dayjs from "dayjs";

export function useTripsQuery(page: number = 1, rowsPerPage: number = 5) {
  return useQuery({
    queryKey: ['trips', page, rowsPerPage],
    queryFn: async () => {
      // Calculate range based on pagination
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await supabase
        .from('trips')
        .select('*, clients(name, type), vehicles(details), drivers(name, avatar_url, contact_number)', { count: 'exact' })
        .range(from, to);

      if (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }

      const formattedTrips: DisplayTrip[] = data.map((trip: any) => ({
        ...trip,
        service_type: trip.service_type, // Ensure this matches the DB column name
        client_name: trip.clients?.name || 'Unknown Client',
        client_type: trip.clients?.type || 'individual',
        vehicle_details: trip.vehicles?.details || 'Unknown Vehicle',
        driver_name: trip.drivers?.name || 'Unknown Driver',
        driver_avatar: trip.drivers?.avatar_url || '',
        driver_contact: trip.drivers?.contact_number || '',
        time: trip.start_time ? dayjs(trip.start_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
        return_time: trip.end_time ? dayjs(trip.end_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
        special_notes: trip.special_instructions || 'None',
        ui_service_type: serviceTypeDisplayMap[trip.service_type] || trip.service_type
      }));

      return { 
        trips: formattedTrips, 
        count: count || 0 
      };
    },
  });
}

export function useTripMutation() {
  return {
    createTrip: async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    updateTrip: async (id: string, tripData: Partial<Trip>) => {
      const { data, error } = await supabase
        .from('trips')
        .update(tripData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    deleteTrip: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    }
  };
}
