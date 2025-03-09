
type ActivityType = 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract';

interface ActivityLogParams {
  title: string;
  type: ActivityType;
  relatedId?: string;
}

// Instead of storing in database, we'll just log the activity
export const logActivity = async ({ title, type, relatedId }: ActivityLogParams): Promise<boolean> => {
  try {
    // Log the activity to console for debugging
    console.log("Activity logged:", {
      title,
      type,
      related_id: relatedId,
      timestamp: new Date().toISOString()
    });
    
    // Return true to indicate successful logging
    return true;
  } catch (err) {
    console.error("Failed to log activity:", err);
    return false;
  }
};
