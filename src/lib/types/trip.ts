
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TripType = 'airport_pickup' | 'airport_dropoff' | 'other' | 'hourly' | 'full_day' | 'multi_day';

export interface TripMessage {
  id: string;
  trip_id: string;
  sender_type: 'admin' | 'driver' | 'client';
  sender_name: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TripAssignment {
  id: string;
  trip_id: string;
  driver_id: string;
  driver_name?: string;
  driver_avatar?: string;
  assigned_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Trip {
  id: string;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: TripType;
  status: TripStatus;
  amount: number;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  // These might come from the database
  flight_number?: string;
  airline?: string;
  terminal?: string;
  special_instructions?: string;
  is_recurring?: boolean;
  service_type?: string;
  time?: string;
  return_time?: string;
}

export interface DisplayTrip extends Trip {
  client_name: string;
  client_type?: "organization" | "individual";
  vehicle_details: string;
  driver_name: string;
  driver_avatar?: string;
  driver_contact?: string;
  // These fields are for UI display only and not stored directly in the database
  special_notes?: string;
  ui_service_type?: string; // Added to store the UI service type corresponding to database type
}

// Helper function to convert trip data to DisplayTrip
export function convertToDisplayTrip(trip: any, clientMap?: Map<string, any>, vehicleMap?: Map<string, any>, driverMap?: Map<string, any>): DisplayTrip {
  // Ensure type and status have default values
  const type = trip.type || trip.service_type || 'other';
  const status = trip.status || 'scheduled';
  
  return {
    ...trip,
    type,
    status,
    client_name: clientMap?.get(trip.client_id)?.name || trip.client_name || 'Unknown Client',
    client_type: clientMap?.get(trip.client_id)?.type || trip.client_type,
    vehicle_details: vehicleMap?.get(trip.vehicle_id)?.make 
      ? `${vehicleMap.get(trip.vehicle_id).make} ${vehicleMap.get(trip.vehicle_id).model}` 
      : trip.vehicle_details || 'Unknown Vehicle',
    driver_name: driverMap?.get(trip.driver_id)?.name || trip.driver_name || 'Unknown Driver',
    driver_avatar: driverMap?.get(trip.driver_id)?.avatar_url || trip.driver_avatar,
    driver_contact: driverMap?.get(trip.driver_id)?.contact || trip.driver_contact,
    special_notes: trip.special_notes || trip.special_instructions || trip.notes || '',
    ui_service_type: tripTypeDisplayMap[trip.type as TripType] || 'Other Service',
    // Ensure all required fields from Trip interface are present with defaults
    start_time: trip.start_time || trip.time,
    end_time: trip.end_time || trip.return_time,
    notes: trip.notes || trip.special_instructions || trip.special_notes || ''
  };
}

// Convert array of trips to DisplayTrip objects
export function convertToDisplayTrips(trips: any[], clientMap?: Map<string, any>, vehicleMap?: Map<string, any>, driverMap?: Map<string, any>): DisplayTrip[] {
  if (!trips || !Array.isArray(trips)) return [];
  return trips.map(trip => convertToDisplayTrip(trip, clientMap, vehicleMap, driverMap));
}

// Mapping of trip types to UI-friendly display names
export const tripTypeDisplayMap: Record<TripType, string> = {
  'airport_pickup': 'Airport Pickup',
  'airport_dropoff': 'Airport Dropoff',
  'other': 'Other Service',
  'hourly': 'Hourly Service',
  'full_day': 'Full Day',
  'multi_day': 'Multi Day'
};
