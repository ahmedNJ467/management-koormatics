
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  has_active_contract?: boolean;
}

export function useClientData() {
  const queryClient = useQueryClient();
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
      
      // Get clients with active contracts (from trips table)
      const { data: activeContractData, error: contractError } = await supabase
        .from('trips')
        .select('client_id')
        .eq('status', 'in_progress')
        .is('invoice_id', null); // Not invoiced yet
      
      if (contractError) {
        console.error("Error fetching active contracts:", contractError);
      }
      
      // Get unique client IDs with active contracts
      const clientsWithActiveContracts = new Set(
        activeContractData?.map(trip => trip.client_id) || []
      );
      
      // Add has_active_contract flag to clients
      const clientsWithFlag = (data || []).map(client => ({
        ...client,
        has_active_contract: clientsWithActiveContracts.has(client.id)
      }));
      
      return clientsWithFlag as Client[];
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

  // Subscribe to real-time changes for trips (to update active contracts)
  useEffect(() => {
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trips' }, 
        () => {
          // Force refresh the clients data when any trip changes occur
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const activeClients = clients?.filter(client => !client.is_archived) || [];
  const archivedClients = clients?.filter(client => client.is_archived) || [];
  const activeContractClients = clients?.filter(client => 
    !client.is_archived && client.has_active_contract
  ) || [];

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
  const filteredActiveContractClients = getFilteredClients(activeContractClients);

  return {
    clients,
    clientsLoading,
    contactCounts,
    memberCounts,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    activeTab,
    setActiveTab,
    activeClients,
    archivedClients,
    activeContractClients,
    filteredActiveClients,
    filteredArchivedClients,
    filteredActiveContractClients
  };
}
