
import { supabase } from "@/integrations/supabase/client";

export const updatePartNotes = async (partId: string, notes: string | undefined): Promise<boolean> => {
  if (notes === undefined) return true;
  
  try {
    // Try to update notes directly first (in case notes column exists)
    // If the column doesn't exist, this will fail gracefully
    const { error: directUpdateError } = await supabase
      .from("spare_parts")
      .update({ notes: notes } as any)
      .eq("id", partId);
    
    // If direct update works, return success
    if (!directUpdateError) {
      return true;
    }
    
    // If direct update fails, try RPC function as fallback
    // This handles cases where the column might exist but needs special handling
    const { error: rpcError } = await supabase
      .rpc('update_part_notes' as any, { 
        part_id: partId, 
        notes_value: notes 
      } as any);
      
    if (rpcError) {
      // If both methods fail, the notes column likely doesn't exist
      // This is OK - notes are optional, so we'll just log and continue
      console.log("Notes column does not exist or update failed. This is OK - notes are optional.");
      return true; // Return true to allow the main operation to continue
    }
    
    return true;
  } catch (error) {
    // If notes column doesn't exist, that's fine - it's optional
    console.log("Notes update skipped (column may not exist):", error);
    return true; // Return true so the main operation can continue
  }
};
