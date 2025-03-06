
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientTabs } from "@/components/clients/client-tabs";
import { useClientData, type Client } from "@/components/clients/hooks/use-client-data";
import { DeleteClientDialog } from "@/components/client-form/delete-client-dialog";
import { supabase } from "@/integrations/supabase/client";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const {
    clientsLoading,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    activeTab,
    setActiveTab,
    activeClients,
    archivedClients,
    filteredActiveClients,
    filteredArchivedClients,
    contactCounts,
    memberCounts
  } = useClientData();

  const handleClientDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setFormOpen(false);
    setSelectedClient(null);
    toast({
      title: "Client archived",
      description: "The client has been moved to the archive.",
    });
  };
  
  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    // When dialog closes, refresh the data
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_contacts_count'] });
      queryClient.invalidateQueries({ queryKey: ['client_members_count'] });
      setSelectedClient(null);
    }
  };

  const handleClientRestore = async (client: Client) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ is_archived: false })
        .eq("id", client.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Client restored",
        description: `${client.name} has been restored.`,
      });
    } catch (error) {
      console.error("Error restoring client:", error);
      toast({
        title: "Error",
        description: "Failed to restore client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClientDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handlePermanentDelete = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // First delete related contacts
      await supabase
        .from("client_contacts")
        .delete()
        .eq("client_id", clientToDelete.id);
      
      // Then delete related members
      await supabase
        .from("client_members")
        .delete()
        .eq("client_id", clientToDelete.id);
      
      // Finally delete the client
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete.id);
      
      if (error) throw error;
      
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      toast({
        title: "Client deleted",
        description: "The client has been permanently deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      setDeleteError(error.message || "Failed to delete client. It might be referenced in other records.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (clientsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships</p>
        </div>
        <Button onClick={() => {
          setSelectedClient(null);
          setFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      <ClientFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      <ClientTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeClients={activeClients}
        archivedClients={archivedClients}
        activeContractClients={[]}
        filteredActiveClients={filteredActiveClients}
        filteredArchivedClients={filteredArchivedClients}
        filteredActiveContractClients={[]}
        contactCounts={contactCounts}
        memberCounts={memberCounts}
        onClientClick={handleClientClick}
        onClientRestore={handleClientRestore}
        onClientDelete={handleClientDeleteClick}
      />

      {formOpen && (
        <ClientFormDialog
          open={formOpen}
          onOpenChange={handleFormClose}
          client={selectedClient}
          onClientDeleted={handleClientDeleted}
        />
      )}

      {deleteDialogOpen && (
        <DeleteClientDialog
          clientName={clientToDelete?.name}
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handlePermanentDelete}
          error={deleteError}
          isSubmitting={isDeleting}
          permanentDelete={true}
        />
      )}
    </div>
  );
}
