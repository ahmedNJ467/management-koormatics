import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./client-card";
import { Button } from "@/components/ui/button";
import {
  ArchiveRestore,
  Trash2,
  Users,
  Building,
  Calendar,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  created_at?: string;
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
  viewMode?: "grid" | "list";
  sortBy?: "name" | "created_at" | "type" | "activity";
  sortOrder?: "asc" | "desc";
}

// Helper function to sort clients
const sortClients = (clients: Client[], sortBy: string, sortOrder: string) => {
  return [...clients].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime();
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "activity":
        // Sort by active contracts, then by type
        if (a.has_active_contract && !b.has_active_contract) comparison = -1;
        else if (!a.has_active_contract && b.has_active_contract)
          comparison = 1;
        else comparison = a.name.localeCompare(b.name);
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });
};

// List view component for clients
function ClientListItem({
  client,
  contactsCount,
  membersCount,
  onClick,
  onRestore,
  onDelete,
  isArchived,
}: {
  client: Client;
  contactsCount?: number;
  membersCount?: number;
  onClick: (client: Client) => void;
  onRestore?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  isArchived?: boolean;
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        client.has_active_contract ? "border-l-4 border-l-green-500" : ""
      } ${isArchived ? "opacity-75" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-4 flex-1 cursor-pointer"
            onClick={() => onClick(client)}
          >
            <Avatar className="h-12 w-12">
              {client.profile_image_url ? (
                <AvatarImage
                  src={client.profile_image_url}
                  alt={client.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">
                  {client.name}
                </h3>
                {client.has_active_contract && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Active Contract
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {client.type === "organization" ? (
                    <>
                      <Building className="w-3 h-3 mr-1" /> Organization
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 mr-1" /> Individual
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {client.email && (
                  <span className="truncate">{client.email}</span>
                )}
                {client.phone && <span>{client.phone}</span>}
                {client.address && (
                  <span className="truncate">{client.address}</span>
                )}
              </div>

              {client.type === "organization" &&
                (contactsCount || membersCount) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {contactsCount !== undefined && (
                      <span>
                        {contactsCount} contact{contactsCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {membersCount !== undefined && (
                      <span>
                        {membersCount} member{membersCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>

          {isArchived && onRestore && onDelete && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(client);
                }}
              >
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Restore
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(client);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
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
  onClientDelete,
  viewMode = "grid",
  sortBy = "name",
  sortOrder = "asc",
}: ClientTabsProps) {
  // Sort the filtered clients
  const sortedActiveClients = sortClients(
    filteredActiveClients,
    sortBy,
    sortOrder
  );
  const sortedArchivedClients = sortClients(
    filteredArchivedClients,
    sortBy,
    sortOrder
  );

  return (
    <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Active
          <Badge variant="secondary" className="ml-1">
            {activeClients.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="archived" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Archived
          <Badge variant="secondary" className="ml-1">
            {archivedClients.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-6">
        {sortedActiveClients.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedActiveClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  contactsCount={
                    client.type === "organization"
                      ? contactCounts?.[client.id]
                      : undefined
                  }
                  membersCount={
                    client.type === "organization"
                      ? memberCounts?.[client.id]
                      : undefined
                  }
                  onClick={onClientClick}
                  showActiveContractBadge={true}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedActiveClients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  contactsCount={
                    client.type === "organization"
                      ? contactCounts?.[client.id]
                      : undefined
                  }
                  membersCount={
                    client.type === "organization"
                      ? memberCounts?.[client.id]
                      : undefined
                  }
                  onClick={onClientClick}
                />
              ))}
            </div>
          )
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    No active clients found
                  </h3>
                  <p className="text-muted-foreground">
                    {filteredActiveClients.length === 0 &&
                    activeClients.length > 0
                      ? "Try adjusting your search or filter criteria."
                      : "Add your first client to get started."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="archived" className="mt-6">
        {sortedArchivedClients.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedArchivedClients.map((client) => (
                <div key={client.id} className="relative">
                  <ClientCard
                    client={client}
                    contactsCount={
                      client.type === "organization"
                        ? contactCounts?.[client.id]
                        : undefined
                    }
                    membersCount={
                      client.type === "organization"
                        ? memberCounts?.[client.id]
                        : undefined
                    }
                    onClick={onClientClick}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {onClientRestore && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientRestore(client);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    )}
                    {onClientDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientDelete(client);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedArchivedClients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  contactsCount={
                    client.type === "organization"
                      ? contactCounts?.[client.id]
                      : undefined
                  }
                  membersCount={
                    client.type === "organization"
                      ? memberCounts?.[client.id]
                      : undefined
                  }
                  onClick={onClientClick}
                  onRestore={onClientRestore}
                  onDelete={onClientDelete}
                  isArchived={true}
                />
              ))}
            </div>
          )
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    No archived clients found
                  </h3>
                  <p className="text-muted-foreground">
                    {filteredArchivedClients.length === 0 &&
                    archivedClients.length > 0
                      ? "Try adjusting your search or filter criteria."
                      : "Archived clients will appear here."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
