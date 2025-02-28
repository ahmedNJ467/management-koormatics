
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useClientDialog(client: any | null, onOpenChange: (open: boolean) => void, onClientDeleted?: () => void) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [deletionError, setDeletionError] = useState<string | null>(null);
  
  const handleDelete = async () => {
    if (!client?.id) return;
    
    try {
      // First check if the client has any associated trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .eq('client_id', client.id)
        .limit(1);
      
      if (tripsError) throw tripsError;
      
      if (tripsData && tripsData.length > 0) {
        setDeletionError("This client cannot be deleted because it has associated trips. Please delete all trips for this client first.");
        return;
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) {
        // Check if this is a foreign key constraint error
        if (error.code === '23503') {
          // Get the constraint details to display a more helpful error
          const match = error.details.match(/table "([^"]+)"/);
          const relatedTable = match ? match[1] : 'another table';
          setDeletionError(`This client cannot be deleted because it is referenced in ${relatedTable}. Please delete all ${relatedTable} entries for this client first.`);
          return;
        }
        throw error;
      }
      
      setShowDeleteConfirm(false);
      setDeletionError(null);
      
      if (onClientDeleted) {
        onClientDeleted();
      } else {
        // If no onClientDeleted callback is provided, close the dialog
        onOpenChange(false);
      }
      
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };
  
  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    activeTab,
    setActiveTab,
    deletionError,
    setDeletionError,
    handleDelete
  };
}
