
import { useClientRealtime } from "./use-client-realtime";
import { useClientsQuery, type Client } from "./use-clients-query";
import { useContactCounts, useMemberCounts } from "./use-client-counts";
import { useClientFiltering } from "./use-client-filtering";

export function useClientData() {
  // Fetch clients data
  const { data: clients, isLoading: clientsLoading } = useClientsQuery();
  
  // Get contact and member counts
  const { data: contactCounts } = useContactCounts();
  const { data: memberCounts } = useMemberCounts();
  
  // Set up realtime subscriptions
  useClientRealtime();
  
  // Handle filtering
  const {
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
  } = useClientFiltering(clients);

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

// Export the Client type from here as well for convenience
export type { Client } from "./use-clients-query";
