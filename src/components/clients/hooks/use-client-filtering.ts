import { useState } from "react";
import { type Client } from "./use-clients-query";

export function useClientFiltering(clients: Client[] = []) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [withContractsOnly, setWithContractsOnly] = useState<boolean>(false);

  const activeClients = clients?.filter((client) => !client.is_archived) || [];
  const archivedClients = clients?.filter((client) => client.is_archived) || [];

  const getFilteredClients = (clientList: Client[]) => {
    return clientList.filter((client) => {
      if (!client) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (client.name?.toLowerCase() || "").includes(searchLower) ||
        (client.contact?.toLowerCase() || "").includes(searchLower) ||
        (client.email?.toLowerCase() || "").includes(searchLower);

      const matchesType = typeFilter === "all" || client.type === typeFilter;

      const matchesContract =
        !withContractsOnly || !!client.has_active_contract;

      return matchesSearch && matchesType && matchesContract;
    });
  };

  const filteredActiveClients = getFilteredClients(activeClients);
  const filteredArchivedClients = getFilteredClients(archivedClients);

  return {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    activeTab,
    setActiveTab,
    withContractsOnly,
    setWithContractsOnly,
    activeClients,
    archivedClients,
    filteredActiveClients,
    filteredArchivedClients,
  };
}
