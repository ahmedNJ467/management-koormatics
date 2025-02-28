
import { Building2, User, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive } from "lucide-react";

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
}

interface ClientCardProps {
  client: Client;
  contactsCount?: number;
  membersCount?: number;
  onClick: (client: Client) => void;
}

export function ClientCard({ client, contactsCount, membersCount, onClick }: ClientCardProps) {
  const isArchived = !!client.is_archived;
  
  return (
    <Card 
      key={client.id} 
      className={`group relative cursor-pointer hover:shadow-md transition-shadow ${isArchived ? 'border-dashed' : ''}`}
      onClick={() => onClick(client)}
    >
      {isArchived && (
        <Badge variant="outline" className="absolute top-2 right-2 bg-muted">
          <Archive className="h-3 w-3 mr-1" /> Archived
        </Badge>
      )}
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden opacity-100">
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
          {client.type === "organization" && !isArchived && (
            <div className="flex gap-2 mt-3">
              {contactsCount && contactsCount > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {contactsCount} Contact{contactsCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {membersCount && membersCount > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  {membersCount} Member{membersCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
