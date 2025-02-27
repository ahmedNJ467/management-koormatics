
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, User, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: clients, isLoading } = useQuery({
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

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };
  
  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const filteredClients = clients?.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    
    return matchesSearch && matchesType;
  });
  
  if (isLoading) {
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients?.map((client) => (
          <Card 
            key={client.id} 
            className="group relative cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleClientClick(client)}
          >
            <CardContent className="p-6">
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" onClick={(e) => handleEdit(e, client)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => confirmDelete(e, client)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={selectedClient}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client {selectedClient?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClient && handleDelete(selectedClient.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
