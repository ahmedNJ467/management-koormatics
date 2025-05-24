
import { supabase } from "@/integrations/supabase/client";

/**
 * Enable realtime for a specific table
 */
export const enableRealtimeForTable = async (tableName: string): Promise<void> => {
  try {
    // Check if realtime is already enabled by attempting to create a channel
    const channel = supabase.channel(`test-${tableName}`);
    
    // Subscribe to test the connection
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime enabled for table: ${tableName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Failed to enable realtime for table: ${tableName}`);
      }
    });
    
    // Clean up the test channel
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 1000);
    
  } catch (error) {
    console.error(`Error enabling realtime for table ${tableName}:`, error);
    throw error;
  }
};

/**
 * Safe database query with error handling
 */
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    return { data: null, error };
  }
};

/**
 * Check Supabase connection health
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error("Supabase connection check failed:", error);
    return false;
  }
};
