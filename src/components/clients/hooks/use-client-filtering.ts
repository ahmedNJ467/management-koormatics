
import { useState } from "react";
import { type Client } from "./use-clients-query";

export function useClientFiltering(clients: Client[] = []) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("active");
  
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
