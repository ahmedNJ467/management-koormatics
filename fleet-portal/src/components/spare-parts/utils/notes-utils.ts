
import { supabase } from "@/integrations/supabase/client";

export const updatePartNotes = async (partId: string, notes: string | undefined): Promise<boolean> => {
  if (notes === undefined) return true;
  
  try {
    // Use our custom RPC function to update the notes field if it exists
    const { error } = await supabase
      .rpc('update_part_notes' as any, { 
        part_id: partId, 
        notes_value: notes 
      } as any);
      
    if (error) {
      console.log("Could not update notes:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log("Failed to update notes, field may not exist:", error);
    return false;
  }
};
