
import { DisplayTrip } from "@/lib/types/trip";

export function useTripFilters(trips?: DisplayTrip[], searchTerm: string = "", statusFilter: string = "all") {
  // Filter trips based on search and status filter
  const filteredTrips = trips?.filter(trip => {
    const matchesSearch = 
      searchTerm === "" ||
      trip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.id.substring(0, 8).toUpperCase().includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return { filteredTrips };
}
