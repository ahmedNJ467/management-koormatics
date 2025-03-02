
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, AtSign, Globe, Building2, User, MapPin, FileText } from "lucide-react";

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
  has_active_contract?: boolean;
}

interface ClientCardProps {
  client: Client;
  contactsCount?: number;
  membersCount?: number;
  onClick: (client: Client) => void;
  showActiveContractBadge?: boolean;
}

export function ClientCard({ client, contactsCount, membersCount, onClick, showActiveContractBadge }: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const avatarSize = client.type === "organization" ? "h-16 w-16" : "h-16 w-16 rounded-full";
  const cardClasses = client.has_active_contract 
    ? "cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
    : "cursor-pointer hover:shadow-md transition-shadow";

  return (
    <Card 
      className={cardClasses}
      onClick={() => onClick(client)}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className={avatarSize}>
          {client.profile_image_url ? (
            <AvatarImage src={client.profile_image_url} alt={client.name} className="object-cover" />
          ) : null}
          <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 flex-1">
          <CardTitle className="flex items-center gap-2">
            {client.name}
            {(client.has_active_contract && showActiveContractBadge) && (
              <Badge className="ml-2 bg-green-500 text-white">Active Contract</Badge>
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            {client.type === "organization" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
            {client.type === "organization" ? "Organization" : "Individual"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2 text-sm space-y-2">
        {client.address && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AtSign className="h-4 w-4 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.website && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="truncate">{client.website}</span>
          </div>
        )}
        {client.description && (
          <div className="flex items-start gap-2 text-muted-foreground mt-2">
            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="line-clamp-2">{client.description}</p>
          </div>
        )}
      </CardContent>
      {(contactsCount !== undefined || membersCount !== undefined) && (
        <CardFooter className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
          {contactsCount !== undefined && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{contactsCount} contact{contactsCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {membersCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{membersCount} member{membersCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
