
import { supabase } from "@/integrations/supabase/client";

type ActivityType = 'trip' | 'maintenance' | 'vehicle' | 'driver' | 'client' | 'fuel' | 'contract';

interface ActivityLogParams {
  title: string;
  type: ActivityType;
  relatedId?: string;
}

export const logActivity = async ({ title, type, relatedId }: ActivityLogParams): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        title,
        type,
        related_id: relatedId,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error logging activity:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Failed to log activity:", err);
    return false;
  }
};
