import { ActivityItemProps } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "./supabase-helpers";

type ActivityType = 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract';

interface ActivityLogParams {
  title: string;
  type: ActivityType;
  relatedId?: string;
  tripDetails?: {
    clientName?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  };
}

// Format timestamps in a human-readable format
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

// Add a new activity to the database
export const logActivity = async ({ title, type, relatedId, tripDetails }: ActivityLogParams): Promise<ActivityItemProps> => {
  const id = Date.now().toString();
  const timestamp = new Date();
  
  // Enhanced icon mapping
  const iconMap: Record<ActivityType, string> = {
    trip: 'calendar',
    maintenance: 'clock',
    vehicle: 'car',
    driver: 'user',
    client: 'building',
    fuel: 'fuel',
    contract: 'file-check'
  };

  // Create more detailed titles for trip activities
  let enhancedTitle = title;
  if (type === 'trip' && tripDetails) {
    const { clientName, pickupLocation, dropoffLocation } = tripDetails;
    if (pickupLocation && dropoffLocation) {
      enhancedTitle = `Trip: ${pickupLocation} to ${dropoffLocation}`;
      if (clientName) {
        enhancedTitle += ` (${clientName})`;
      }
    }
  }

  const newActivity: ActivityItemProps = {
    id,
    title: enhancedTitle,
    timestamp: formatTimestamp(timestamp),
    type,
    icon: iconMap[type] || 'activity',
    related_id: relatedId
  };
  
  // Save to the database with better error handling
  try {
    // Check if connection is healthy before attempting to save
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn("Database connection not available, activity not saved:", enhancedTitle);
      return newActivity;
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([
        { 
          title: enhancedTitle, 
          type, 
          related_id: relatedId,
          timestamp: timestamp.toISOString()
        }
      ]);
      
    if (error) {
      console.error("Error saving activity to database:", error);
      // Still return the activity object for local use
    } else {
      console.log("Activity logged successfully:", enhancedTitle);
    }
  } catch (err) {
    console.error("Failed to log activity to database:", err);
    // Continue execution even if database save fails
  }
  
  return newActivity;
};

// Get activities from the database
export const getActivities = async (limit?: number): Promise<ActivityItemProps[]> => {
  try {
    // Check connection health first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn("Database connection not available for fetching activities");
      return [];
    }

    const query = supabase
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (limit) {
      query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id.toString(),
      title: item.title,
      timestamp: formatTimestamp(new Date(item.timestamp)),
      type: item.type as ActivityType,
      icon: item.type as ActivityType,
      related_id: item.related_id
    }));
  } catch (err) {
    console.error("Failed to fetch activities:", err);
    return [];
  }
};

// Enhanced trip activity logging with proper trip details
export const logTripActivity = async (action: string, tripId: string, tripData?: any): Promise<void> => {
  try {
    // Fetch trip details to create a meaningful activity
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        clients:client_id(name),
        vehicles:vehicle_id(make, model, registration),
        drivers:driver_id(name)
      `)
      .eq('id', tripId)
      .single();

    if (error || !trip) {
      console.warn('Could not fetch trip details for activity logging');
      return;
    }

    const clientName = trip.clients?.name || 'Unknown Client';
    const vehicleDetails = trip.vehicles 
      ? `${trip.vehicles.make} ${trip.vehicles.model}` 
      : 'Unknown Vehicle';
    const driverName = trip.drivers?.name || 'Unassigned Driver';

    let title = '';
    switch (action) {
      case 'created':
        title = `New trip created: ${trip.pickup_location || 'Unknown'} to ${trip.dropoff_location || 'Unknown'}`;
        break;
      case 'updated':
        title = `Trip updated: ${clientName} - ${trip.pickup_location || 'Unknown'} to ${trip.dropoff_location || 'Unknown'}`;
        break;
      case 'assigned':
        title = `Vehicle assigned: ${vehicleDetails} to trip for ${clientName}`;
        break;
      case 'driver_assigned':
        title = `Driver assigned: ${driverName} to trip for ${clientName}`;
        break;
      case 'completed':
        title = `Trip completed: ${clientName} - ${trip.pickup_location || 'Unknown'} to ${trip.dropoff_location || 'Unknown'}`;
        break;
      default:
        title = `Trip ${action}: ${clientName}`;
    }

    await logActivity({
      title,
      type: 'trip',
      relatedId: tripId,
      tripDetails: {
        clientName,
        pickupLocation: trip.pickup_location,
        dropoffLocation: trip.dropoff_location
      }
    });
  } catch (err) {
    console.error('Error logging trip activity:', err);
  }
};

// Generate sample activities if needed (for development/testing)
export const generateSampleActivities = async (): Promise<void> => {
  try {
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn("Database connection not available for generating sample activities");
      return;
    }

    const { data, error } = await supabase
      .from('activities')
      .select('count')
      .single();
      
    // Only seed if there are no activities and no error occurred
    if (!error && data && data.count === 0) {
      const sampleActivities: ActivityLogParams[] = [
        {
          title: "Trip completed: Airport pickup",
          type: "trip"
        },
        {
          title: "Vehicle maintenance completed for TRUCK-002",
          type: "maintenance"
        },
        {
          title: "New driver onboarded: Sarah Johnson",
          type: "driver"
        },
        {
          title: "Fuel refill: 45 gallons for SUV-001",
          type: "fuel"
        },
        {
          title: "New contract signed with Client XYZ Corp",
          type: "contract"
        },
        {
          title: "Vehicle VAN-003 added to the fleet",
          type: "vehicle"
        },
        {
          title: "New client onboarded: ABC Industries",
          type: "client"
        }
      ];
      
      // Add sample activities to database
      for (const activity of sampleActivities) {
        await logActivity(activity);
      }
      
      console.log("Sample activities generated");
    }
  } catch (err) {
    console.error("Failed to generate sample activities:", err);
  }
};
