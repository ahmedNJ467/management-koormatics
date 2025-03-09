
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to enable real-time functionality for a specific table
 */
export const enableRealtimeForTable = async (tableName: string): Promise<void> => {
  try {
    // Check if the table already has REPLICA IDENTITY FULL set
    const { data: replicaData, error: replicaError } = await supabase.rpc(
      'check_replica_identity',
      { table_name: tableName }
    );
    
    if (replicaError) {
      console.error(`Error checking replica identity for ${tableName}:`, replicaError);
    }
    
    // If table doesn't have REPLICA IDENTITY FULL, set it
    if (!replicaData || !replicaData.has_replica_identity_full) {
      const { error: setReplicaError } = await supabase.rpc(
        'set_replica_identity_full',
        { table_name: tableName }
      );
      
      if (setReplicaError) {
        console.error(`Error setting replica identity for ${tableName}:`, setReplicaError);
      }
    }
    
    // Add the table to the publication if it's not already there
    const { error: addPublicationError } = await supabase.rpc(
      'add_table_to_publication',
      { table_name: tableName }
    );
    
    if (addPublicationError) {
      console.error(`Error adding ${tableName} to publication:`, addPublicationError);
    }
    
    console.log(`Real-time enabled for ${tableName}`);
  } catch (error) {
    console.error(`Failed to enable real-time for ${tableName}:`, error);
  }
};
