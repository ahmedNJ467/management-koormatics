import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users2,
  Building2,
  TrendingUp,
  Activity,
  Phone,
  Users,
  Globe,
  MapPin,
} from "lucide-react";
import { Client } from "@/lib/types/client";

interface ClientSummaryCardsProps {
  activeClients: Client[];
  archivedClients: Client[];
  contactCounts?: Record<string, number>;
  memberCounts?: Record<string, number>;
}

export function ClientSummaryCards({
  activeClients,
  archivedClients,
  contactCounts,
  memberCounts,
}: ClientSummaryCardsProps) {
  // Calculate statistics
  const totalClients = activeClients.length + archivedClients.length;
  const organizationsCount = activeClients.filter(
    (c) => c.type === "organization"
  ).length;
  const individualsCount = activeClients.filter(
    (c) => c.type === "individual"
  ).length;
  const activeContractsCount = activeClients.filter(
    (c) => c.has_active_contract
  ).length;
  const totalContacts = Object.values(contactCounts || {}).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalMembers = Object.values(memberCounts || {}).reduce(
    (sum, count) => sum + count,
    0
  );

  // Calculate growth metrics
  const contractRate =
    activeClients.length > 0
      ? Math.round((activeContractsCount / activeClients.length) * 100)
      : 0;
  const organizationRate =
    activeClients.length > 0
      ? Math.round((organizationsCount / activeClients.length) * 100)
      : 0;

  // Client locations (basic analysis from addresses)
  const clientsWithAddress = activeClients.filter((c) => c.address).length;
  const clientsWithWebsite = activeClients.filter((c) => c.website).length;
  const clientsWithEmail = activeClients.filter((c) => c.email).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Clients */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totalClients}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {activeClients.length} active • {archivedClients.length} archived
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Badge
              variant="outline"
              className="text-xs border-blue-300 text-blue-700"
            >
              {((activeClients.length / totalClients) * 100).toFixed(0)}% active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Organizations</CardTitle>
          <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {organizationsCount}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            {individualsCount} individuals • {organizationRate}% organizations
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Badge
              variant="outline"
              className="text-xs border-green-300 text-green-700"
            >
              <Users className="h-3 w-3 mr-1" />
              {totalMembers} members
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Active Contracts */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Contracts
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {activeContractsCount}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {contractRate}% contract rate •{" "}
            {activeClients.length - activeContractsCount} without contracts
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Badge
              variant="outline"
              className="text-xs border-amber-300 text-amber-700"
            >
              {contractRate >= 70
                ? "High"
                : contractRate >= 40
                ? "Medium"
                : "Low"}{" "}
              engagement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Network */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact Network</CardTitle>
          <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {totalContacts + totalMembers}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {totalContacts} contacts • {totalMembers} team members
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Badge
              variant="outline"
              className="text-xs border-purple-300 text-purple-700"
            >
              <Phone className="h-3 w-3 mr-1" />
              Avg{" "}
              {(
                (totalContacts + totalMembers) /
                Math.max(organizationsCount, 1)
              ).toFixed(1)}{" "}
              per org
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights Row */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Client Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  With Address
                </span>
                <span className="font-semibold">{clientsWithAddress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  With Website
                </span>
                <span className="font-semibold">{clientsWithWebsite}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Complete Profiles
                </span>
                <span className="font-semibold">
                  {
                    activeClients.filter((c) => c.email && c.phone && c.address)
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Quality</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round((clientsWithEmail / activeClients.length) * 100)}%
                  complete
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Contract Conversion Rate
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(contractRate, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{contractRate}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Organization Ratio</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(organizationRate, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {organizationRate}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Completeness</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (clientsWithEmail / activeClients.length) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {Math.round((clientsWithEmail / activeClients.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
