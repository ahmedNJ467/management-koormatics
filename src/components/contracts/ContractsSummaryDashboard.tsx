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
