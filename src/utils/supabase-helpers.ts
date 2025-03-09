
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Enable realtime for a table by setting REPLICA IDENTITY FULL and adding to publication
export const enableRealtimeForTable = async (tableName: string): Promise<boolean> => {
  try {
    // Call our custom function to enable realtime for the table
    const { data, error } = await supabase.rpc('enable_realtime_for_table', { 
      table_name: tableName 
    });
    
    if (error) throw error;
    
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for ${tableName}:`, error);
    return false;
  }
};

// Helper hook for initializing realtime on multiple tables
export const useInitializeRealtime = (tableNames: string[]) => {
  useEffect(() => {
    const initTables = async () => {
      for (const tableName of tableNames) {
        await enableRealtimeForTable(tableName);
      }
    };
    
    initTables();
  }, [tableNames]);
};
