
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
        setDeletionError("This client cannot be archived because it has associated trips. Please delete all trips for this client first.");
        return;
      }
      
      // Instead of deleting, we're archiving the client by setting is_archived to true
      const { error } = await supabase
        .from('clients')
        .update({ is_archived: true })
        .eq('id', client.id);

      if (error) {
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
        title: "Client archived",
        description: "The client has been moved to archive successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to archive client",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    if (!client?.id) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_archived: false })
        .eq('id', client.id);

      if (error) {
        throw error;
      }
      
      if (onClientDeleted) {
        onClientDeleted();
      } else {
        // If no callback is provided, close the dialog
        onOpenChange(false);
      }
      
      toast({
        title: "Client restored",
        description: "The client has been restored successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to restore client",
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
    handleDelete,
    handleRestore
  };
}
