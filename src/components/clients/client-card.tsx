import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Phone,
  AtSign,
  Globe,
  Building2,
  User,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Client } from "@/lib/types/client";

interface ClientCardProps {
  client: Client;
  contactsCount?: number;
  membersCount?: number;
  onClick: (client: Client) => void;
  showActiveContractBadge?: boolean;
}

export function ClientCard({
  client,
  contactsCount,
  membersCount,
  onClick,
  showActiveContractBadge,
}: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const avatarSize =
    client.type === "organization"
      ? "h-16 w-16 rounded-xl"
      : "h-16 w-16 rounded-full";

  const cardClasses = `cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group ${
    client.has_active_contract
      ? "border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/30 to-transparent dark:from-green-950/30"
      : "hover:border-primary/20"
  }`;

  // Determine if we should show the footer with counts
  const shouldShowCounts =
    client.type === "organization" &&
    (contactsCount !== undefined || membersCount !== undefined);

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className={cardClasses} onClick={() => onClick(client)}>
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="relative">
          <Avatar className={avatarSize}>
            {client.profile_image_url ? (
              <AvatarImage
                src={client.profile_image_url}
                alt={client.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          {client.has_active_contract && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {client.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-medium">
                {client.type === "organization" ? (
                  <>
                    <Building2 className="h-3 w-3 mr-1" />
                    Organization
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Individual
                  </>
                )}
              </Badge>
              {client.has_active_contract && showActiveContractBadge && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active Contract
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Contact Information */}
        <div className="space-y-2">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AtSign className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate font-medium">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-green-500" />
              <span className="font-medium">{client.phone}</span>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0 text-purple-500" />
              <span className="truncate font-medium">{client.website}</span>
            </div>
          )}
        </div>

        {/* Address */}
        {client.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
            <span className="line-clamp-2 font-medium">{client.address}</span>
          </div>
        )}

        {/* Description */}
        {client.description && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
              <p className="line-clamp-3 leading-relaxed">
                {client.description}
              </p>
            </div>
          </div>
        )}

        {/* Date Information */}
        {client.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span>Added {formatDate(client.created_at)}</span>
          </div>
        )}
      </CardContent>

      {shouldShowCounts && (
        <CardFooter className="pt-3 border-t border-border/50">
          <div className="w-full flex justify-between items-center text-xs">
            {contactsCount !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Phone className="h-3 w-3" />
                <span className="font-medium">
                  {contactsCount} contact{contactsCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {membersCount !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Users className="h-3 w-3" />
                <span className="font-medium">
                  {membersCount} member{membersCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
