import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./client-card";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Trash2 } from "lucide-react";

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
  has_active_contract?: boolean;
}

interface ClientTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeClients: Client[];
  archivedClients: Client[];
  filteredActiveClients: Client[];
  filteredArchivedClients: Client[];
  contactCounts?: Record<string, number>;
  memberCounts?: Record<string, number>;
  onClientClick: (client: Client) => void;
  onClientRestore?: (client: Client) => void;
  onClientDelete?: (client: Client) => void;
}

export function ClientTabs({
  activeTab,
  setActiveTab,
  activeClients,
  archivedClients,
  filteredActiveClients,
  filteredArchivedClients,
  contactCounts,
  memberCounts,
  onClientClick,
  onClientRestore,
  onClientDelete
}: ClientTabsProps) {
  return (
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
              <ClientCard 
                key={client.id}
                client={client}
                contactsCount={client.type === "organization" ? contactCounts?.[client.id] : undefined}
                membersCount={client.type === "organization" ? memberCounts?.[client.id] : undefined}
                onClick={onClientClick}
              />
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
              <ClientCard
                key={client.id}
                client={client}
                contactsCount={client.type === "organization" ? contactCounts?.[client.id] : undefined}
                membersCount={client.type === "organization" ? memberCounts?.[client.id] : undefined}
                onClick={onClientClick}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-muted-foreground">No archived clients found with the current filter.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
