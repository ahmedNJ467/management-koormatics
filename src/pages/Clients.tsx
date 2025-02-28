
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, User, Search, UserPlus, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  created_at?: string;
  updated_at?: string;
}

interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
}

interface ClientMember {
  id: string;
  client_id: string;
  name: string;
  role?: string; 
  email?: string;
  phone?: string;
  notes?: string;
}

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("active");

  // Get clients data
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Get client contacts counts
  const { data: contactCounts } = useQuery({
    queryKey: ['client_contacts_count'],
    queryFn: async () => {
      // First get all client IDs
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id');
      
      if (clientError) throw clientError;
      
      const clientIds = clientData.map(client => client.id);
      
      // For each client, count contacts
      const countsPromises = clientIds.map(async (clientId) => {
        const { count, error } = await supabase
          .from('client_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId);
        
        if (error) throw error;
        
        return { clientId, count: count || 0 };
      });
      
      const countsResults = await Promise.all(countsPromises);
      
      // Convert to record
      const counts: Record<string, number> = {};
      countsResults.forEach(result => {
        counts[result.clientId] = result.count;
      });
      
      return counts;
    },
  });

  // Get client members counts
  const { data: memberCounts } = useQuery({
    queryKey: ['client_members_count'],
    queryFn: async () => {
      try {
        // Check if the table exists first
        try {
          await supabase.from('client_members').select('id').limit(1);
        } catch (error) {
          console.error("Error checking client_members table:", error);
          return {};
        }

        // First get all client IDs
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id');
        
        if (clientError) throw clientError;
        
        const clientIds = clientData.map(client => client.id);
        
        // For each client, count members
        const countsPromises = clientIds.map(async (clientId) => {
          const { count, error } = await supabase
            .from('client_members')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);
          
          if (error) {
            console.error("Error counting members for client", clientId, error);
            return { clientId, count: 0 };
          }
          
          return { clientId, count: count || 0 };
        });
        
        const countsResults = await Promise.all(countsPromises);
        
        // Convert to record
        const counts: Record<string, number> = {};
        countsResults.forEach(result => {
          counts[result.clientId] = result.count;
        });
        
        return counts;
      } catch (error) {
        console.error("Error fetching member counts:", error);
        return {};
      }
    },
  });
  
  // Subscribe to real-time changes for clients
  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' }, 
        () => {
          // Force refresh the clients data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to real-time changes for client contacts
  useEffect(() => {
    const channel = supabase
      .channel('client-contacts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_contacts' }, 
        () => {
          // Force refresh the clients data when any contact changes occur
          queryClient.invalidateQueries({ queryKey: ["client_contacts_count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to real-time changes for client members
  useEffect(() => {
    const channel = supabase
      .channel('client-members-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_members' }, 
        () => {
          // Force refresh the member counts when any member changes occur
          queryClient.invalidateQueries({ queryKey: ["client_members_count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const activeClients = clients?.filter(client => !client.is_archived) || [];
  const archivedClients = clients?.filter(client => client.is_archived) || [];

  const getFilteredClients = (clientList: Client[]) => {
    return clientList.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || client.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  };

  const filteredActiveClients = getFilteredClients(activeClients);
  const filteredArchivedClients = getFilteredClients(archivedClients);
  
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

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-1">
            Active <Badge variant="secondary">{activeClients.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-1">
            Archived <Badge variant="secondary">{archivedClients.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredActiveClients.length > 0 ? (
              filteredActiveClients.map((client) => (
                <Card 
                  key={client.id} 
                  className="group relative cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleClientClick(client)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
                        {client.profile_image_url ? (
                          <img
                            src={client.profile_image_url}
                            alt={client.name}
                            className="h-full w-full object-cover"
                          />
                        ) : client.type === "organization" ? (
                          <Building2 className="h-6 w-6 text-secondary" />
                        ) : (
                          <User className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{client.type}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {client.description && (
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                      )}
                      {client.website && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Website:</span>
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {client.website}
                          </a>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Address:</span>
                          <span>{client.address}</span>
                        </div>
                      )}
                      {client.contact && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contact:</span>
                          <span>{client.contact}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      {/* Display contacts and members badges for organizations */}
                      {client.type === "organization" && (
                        <div className="flex gap-2 mt-3">
                          {contactCounts && contactCounts[client.id] > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {contactCounts[client.id]} Contact{contactCounts[client.id] !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {memberCounts && memberCounts[client.id] > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              {memberCounts[client.id]} Member{memberCounts[client.id] !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No active clients found with the current filter.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArchivedClients.length > 0 ? (
              filteredArchivedClients.map((client) => (
                <Card 
                  key={client.id} 
                  className="group relative cursor-pointer hover:shadow-md transition-shadow border-dashed"
                  onClick={() => handleClientClick(client)}
                >
                  <Badge variant="outline" className="absolute top-2 right-2 bg-muted">
                    <Archive className="h-3 w-3 mr-1" /> Archived
                  </Badge>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden opacity-70">
                        {client.profile_image_url ? (
                          <img
                            src={client.profile_image_url}
                            alt={client.name}
                            className="h-full w-full object-cover"
                          />
                        ) : client.type === "organization" ? (
                          <Building2 className="h-6 w-6 text-secondary" />
                        ) : (
                          <User className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{client.type}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {client.description && (
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                      )}
                      {client.website && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Website:</span>
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {client.website}
                          </a>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Address:</span>
                          <span>{client.address}</span>
                        </div>
                      )}
                      {client.contact && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contact:</span>
                          <span>{client.contact}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No archived clients found with the current filter.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        client={selectedClient}
        onClientDeleted={handleClientDeleted}
      />
    </div>
  );
}
