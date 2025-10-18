import { useClientRealtime } from "./use-client-realtime";
import { useClientsQuery, type Client } from "./use-clients-query";
import { useContactCounts, useMemberCounts } from "./use-client-counts";
import { useClientFiltering } from "./use-client-filtering";

export function useClientData() {
  // Fetch all data in parallel for better performance
  const { data: clients, isLoading: clientsLoading } = useClientsQuery();
  const { data: contactCounts, isLoading: contactCountsLoading } =
    useContactCounts();
  const { data: memberCounts, isLoading: memberCountsLoading } =
    useMemberCounts();

  // Set up realtime subscriptions
  useClientRealtime();

  // Handle filtering
  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    withContractsOnly,
    setWithContractsOnly,
    activeTab,
    setActiveTab,
    activeClients,
    archivedClients,
    filteredActiveClients,
    filteredArchivedClients,
  } = useClientFiltering(clients);

  // Combined loading state
  const isLoading =
    clientsLoading || contactCountsLoading || memberCountsLoading;

  return {
    clients,
    clientsLoading: isLoading,
    contactCounts,
    memberCounts,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    withContractsOnly,
    setWithContractsOnly,
    activeTab,
    setActiveTab,
    activeClients,
    archivedClients,
    filteredActiveClients,
    filteredArchivedClients,
  };
}

// Export the Client type from here as well for convenience
export type { Client } from "./use-clients-query";
