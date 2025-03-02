
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientTabs } from "@/components/clients/client-tabs";
import { useClientData } from "@/components/clients/use-client-data";

interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  description?: string;
  website?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  is_archived?: boolean;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
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
        filteredActiveClients={filteredActiveClients}
        filteredArchivedClients={filteredArchivedClients}
        contactCounts={contactCounts}
        memberCounts={memberCounts}
        onClientClick={handleClientClick}
      />

      {formOpen && (
        <ClientFormDialog
          open={formOpen}
          onOpenChange={handleFormClose}
          client={selectedClient}
          onClientDeleted={handleClientDeleted}
        />
      )}
    </div>
  );
}
