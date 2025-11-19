import { useClientRealtime } from "./use-client-realtime";
import { useClientsQuery, type Client } from "./use-clients-query";
import { useContactCounts, useMemberCounts } from "./use-client-counts";
import { useClientFiltering } from "./use-client-filtering";

export function useClientData() {
  // Fetch all data in parallel for better performance
  // Use placeholderData to show cached data immediately
  const { data: clients = [], isLoading: clientsLoading, isFetching: clientsFetching } = useClientsQuery();
  const { data: contactCounts = {}, isLoading: contactCountsLoading } =
    useContactCounts();
  const { data: memberCounts = {}, isLoading: memberCountsLoading } =
    useMemberCounts();

  // Set up realtime subscriptions
  useClientRealtime();

  // Handle filtering - use empty array as fallback to prevent errors
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
  } = useClientFiltering(clients || []);

  // Only show loading on initial load, not when refetching
  // This allows cached data to display immediately
  const isLoading = clientsLoading && !clients;

  return {
    clients: clients || [],
    clientsLoading: isLoading, // Only true on initial load
    clientsFetching, // True when refetching in background
    contactCounts: contactCounts || {},
    memberCounts: memberCounts || {},
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    withContractsOnly,
    setWithContractsOnly,
    activeTab,
    setActiveTab,
    activeClients: activeClients || [],
    archivedClients: archivedClients || [],
    filteredActiveClients: filteredActiveClients || [],
    filteredArchivedClients: filteredArchivedClients || [],
  };
}

// Export the Client type from here as well for convenience
export type { Client } from "./use-clients-query";
