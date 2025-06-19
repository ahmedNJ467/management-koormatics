import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, LayoutList, FileSpreadsheet } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientTabs } from "@/components/clients/client-tabs";
import {
  useClientData,
  type Client,
} from "@/components/clients/hooks/use-client-data";
import { DeleteClientDialog } from "@/components/client-form/delete-client-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "name" | "created_at" | "type" | "activity"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
    memberCounts,
  } = useClientData();

  const handleClientDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    setFormOpen(false);
    setSelectedClient(null);
    toast({
      title: "Client deleted",
      description: "The client has been completely removed from the system.",
      variant: "destructive",
    });
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client_contacts_count"] });
      queryClient.invalidateQueries({ queryKey: ["client_members_count"] });
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

      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete.id);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setClientToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      toast({
        title: "Client deleted",
        description: "The client has been completely removed from the system.",
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      setDeleteError(
        error.message ||
          "Failed to delete client. It might be referenced in other records."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportClients = async () => {
    try {
      const dataToExport =
        activeTab === "active"
          ? filteredActiveClients
          : filteredArchivedClients;

      // Create CSV content
      const headers = [
        "Name",
        "Type",
        "Email",
        "Phone",
        "Address",
        "Website",
        "Description",
        "Status",
      ];
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((client) =>
          [
            `"${client.name}"`,
            client.type,
            `"${client.email || ""}"`,
            `"${client.phone || ""}"`,
            `"${client.address || ""}"`,
            `"${client.website || ""}"`,
            `"${client.description || ""}"`,
            client.has_active_contract
              ? "Active Contract"
              : "No Active Contract",
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients-${activeTab}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `${dataToExport.length} clients exported successfully.`,
      });
    } catch (error) {
      console.error("Error exporting clients:", error);
      toast({
        title: "Export failed",
        description: "Failed to export clients. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (clientsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage and track your client relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportClients}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => {
              setSelectedClient(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Client Management</CardTitle>
              <CardDescription>
                Search, filter, and manage your clients
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">View:</span>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as any)}
                  size="sm"
                >
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <LayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as any)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClientFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />
        </CardContent>
      </Card>

      {/* Client Tabs */}
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
        onClientRestore={handleClientRestore}
        onClientDelete={handleClientDeleteClick}
        viewMode={viewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
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
