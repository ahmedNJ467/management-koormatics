import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Contract } from "@/pages/Contracts";
import { addDays, isAfter, isBefore, formatDistanceToNow } from "date-fns";

interface ContractsSummaryDashboardProps {
  contracts: Contract[];
}

const ContractsSummaryDashboard = ({
  contracts,
}: ContractsSummaryDashboardProps) => {
  // Calculate metrics
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const pendingContracts = contracts.filter(
    (c) => c.status === "pending"
  ).length;
  const expiredContracts = contracts.filter(
    (c) => c.status === "expired"
  ).length;
  const terminatedContracts = contracts.filter(
    (c) => c.status === "terminated"
  ).length;

  // Contracts expiring soon (within 30 days)
  const soonToExpire = contracts.filter((c) => {
    if (c.status !== "active") return false;
    const endDate = new Date(c.end_date);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return isAfter(endDate, new Date()) && isBefore(endDate, thirtyDaysFromNow);
  });

  // Recently created contracts (last 30 days)
  const recentContracts = contracts.filter((c) => {
    const createdDate = new Date(c.created_at);
    const thirtyDaysAgo = addDays(new Date(), -30);
    return isAfter(createdDate, thirtyDaysAgo);
  }).length;

  // Contracts with files
  const contractsWithFiles = contracts.filter((c) => c.contract_file).length;

  // Success rate (active / total)
  const successRate =
    totalContracts > 0
      ? Math.round((activeContracts / totalContracts) * 100)
      : 0;

  // Average contract duration (for completed contracts)
  const completedContracts = contracts.filter(
    (c) => c.status === "expired" || c.status === "terminated"
  );
  const avgDuration =
    completedContracts.length > 0
      ? Math.round(
          completedContracts.reduce((sum, contract) => {
            const start = new Date(contract.start_date);
            const end = new Date(contract.end_date);
            return (
              sum +
              Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
          }, 0) / completedContracts.length
        )
      : 0;

  // Top clients by contract count
  const clientCounts = contracts.reduce((acc, contract) => {
    acc[contract.client_name] = (acc[contract.client_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topClients = Object.entries(clientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contracts
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalContracts}
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-3 w-3" />
              {recentContracts} added this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {successRate}%
            </div>
            <Progress value={successRate} className="mt-2 h-2" />
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {activeContracts} of {totalContracts} contracts active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {soonToExpire.length}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {avgDuration}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Days per contract
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution and Top Clients */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Contract Status Distribution
            </CardTitle>
            <CardDescription>Overview of all contract statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{activeContracts}</span>
                <Badge variant="default">
                  {Math.round((activeContracts / totalContracts) * 100) || 0}%
                </Badge>
              </div>
            </div>
            <Progress
              value={(activeContracts / totalContracts) * 100}
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{pendingContracts}</span>
                <Badge variant="secondary">
                  {Math.round((pendingContracts / totalContracts) * 100) || 0}%
                </Badge>
              </div>
            </div>
            <Progress
              value={(pendingContracts / totalContracts) * 100}
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{expiredContracts}</span>
                <Badge variant="destructive">
                  {Math.round((expiredContracts / totalContracts) * 100) || 0}%
                </Badge>
              </div>
            </div>
            <Progress
              value={(expiredContracts / totalContracts) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Clients</CardTitle>
            <CardDescription>Clients with most contracts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topClients.length > 0 ? (
              topClients.map(([client, count], index) => (
                <div key={client} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {client}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{count}</span>
                    <Badge variant="outline">
                      {Math.round((count / totalContracts) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No client data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {soonToExpire.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Contracts Expiring Soon
            </CardTitle>
            <CardDescription>
              Review these contracts before they expire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {soonToExpire.slice(0, 5).map((contract) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(contract.end_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={contract.id}
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-md"
                  >
                    <div>
                      <div className="font-medium">{contract.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Client: {contract.client_name}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        daysUntilExpiry <= 7
                          ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                          : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {daysUntilExpiry} days left
                    </Badge>
                  </div>
                );
              })}
              {soonToExpire.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  And {soonToExpire.length - 5} more contracts...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractsSummaryDashboard;
