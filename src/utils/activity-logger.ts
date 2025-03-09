
import { ActivityItemProps } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";

type ActivityType = 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract';

interface ActivityLogParams {
  title: string;
  type: ActivityType;
  relatedId?: string;
}

// In-memory storage for activities as a fallback
const activities: ActivityItemProps[] = [];

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

// Add a new activity to the database and in-memory store
export const logActivity = async ({ title, type, relatedId }: ActivityLogParams): Promise<ActivityItemProps> => {
  const id = Date.now().toString();
  const timestamp = new Date();
  
  // Updated icon mapping to align with our new design
  const iconMap: Record<ActivityType, string> = {
    trip: 'calendar',
    maintenance: 'clock',
    vehicle: 'car',
    driver: 'user',
    client: 'building',
    fuel: 'fuel',
    contract: 'file-check'
  };

  const newActivity: ActivityItemProps = {
    id,
    title,
    type,
    timestamp: formatTimestamp(timestamp),
    icon: iconMap[type] || 'activity'
  };
  
  // Add to the front of the in-memory array
  activities.unshift(newActivity);
  
  // Keep only the last 50 activities
  if (activities.length > 50) {
    activities.length = 50;
  }
  
  // Save to the database
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        { 
          title, 
          type, 
          related_id: relatedId,
          timestamp: timestamp.toISOString()
        }
      ]);
      
    if (error) {
      console.error("Error saving activity to database:", error);
    }
  } catch (err) {
    console.error("Failed to log activity to database:", err);
  }
  
  // Log for debugging
  console.log("Activity logged:", {
    id,
    title,
    type,
    related_id: relatedId,
    timestamp: timestamp.toISOString()
  });
  
  return newActivity;
};

// Get all logged activities from in-memory store (fallback)
export const getActivities = (limit?: number): ActivityItemProps[] => {
  return limit ? activities.slice(0, limit) : [...activities];
};

// Clear all activities (useful for testing)
export const clearActivities = (): void => {
  activities.length = 0;
};

// Generate sample activities
export const generateSampleActivities = async (): Promise<void> => {
  const now = new Date();
  
  const sampleActivities: ActivityLogParams[] = [
    {
      title: "Trip completed: Airport pickup #T-2023-112",
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
  
  // Clear existing in-memory activities
  clearActivities();
  
  // Check if we have activities in the database
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .limit(1);
    
  // Only seed if there are no activities
  if (error || (data && data.length === 0)) {
    // Add sample activities to database
    for (const activity of sampleActivities) {
      await logActivity(activity);
    }
  }
  
  // Add sample activities to in-memory cache with different timestamps
  sampleActivities.forEach((activity, index) => {
    // Create the activity with a timestamp offset based on index
    const timestamp = new Date(now.getTime() - (index * 2 + 1) * 3600000);
    const formattedTimestamp = formatTimestamp(timestamp);
    
    activities.push({
      id: (Date.now() - index * 1000).toString(),
      title: activity.title,
      type: activity.type,
      timestamp: formattedTimestamp,
      icon: activity.type
    });
  });
};

// Initialize with sample data
generateSampleActivities();
