import {
  FileText,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contract } from "@/pages/Contracts";
import { formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

interface ContractTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onDownload: (contract: Contract) => void;
  viewMode?: "table" | "cards";
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "expired":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "terminated":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "expired":
      return "destructive";
    case "terminated":
      return "destructive";
    default:
      return "outline";
  }
};

const isContractExpiringSoon = (contract: Contract) => {
  if (contract.status !== "active") return false;
  const endDate = new Date(contract.end_date);
  const thirtyDaysFromNow = addDays(new Date(), 30);
  return isAfter(endDate, new Date()) && isBefore(endDate, thirtyDaysFromNow);
};

const ContractTable = ({
  contracts,
  onEdit,
  onDelete,
  onDownload,
  viewMode = "table",
}: ContractTableProps) => {
  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No contracts found
        </h3>
        <p className="text-sm text-muted-foreground">
          {viewMode === "table"
            ? "The table will appear here when contracts are added."
            : "Contract cards will appear here when contracts are added."}
        </p>
      </div>
    );
  }

  if (viewMode === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => {
          const isExpiringSoon = isContractExpiringSoon(contract);
          const daysUntilExpiry =
            contract.status === "active"
              ? Math.ceil(
                  (new Date(contract.end_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

          return (
            <Card
              key={contract.id}
              className={`group hover:shadow-lg transition-all duration-200 ${
                isExpiringSoon
                  ? "ring-2 ring-amber-200 bg-amber-50/50 dark:ring-amber-800 dark:bg-amber-950/50"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                      {contract.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {contract.client_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge
                      variant={getStatusBadgeVariant(contract.status)}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status.charAt(0).toUpperCase() +
                        contract.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                {isExpiringSoon && (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Expires in {daysUntilExpiry} days
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs font-medium">
                        Start Date
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(contract.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs font-medium">
                        End Date
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(contract.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs font-medium">
                      Created
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(contract.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  {contract.contract_file && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                      <FileText className="h-3 w-3" />
                      Document attached
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(contract)}
                      className="h-8 px-2"
                      title="Edit contract"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(contract)}
                      className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete contract"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {contract.contract_file && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(contract)}
                      className="h-8 px-3"
                      title="Download contract"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Contract Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const isExpiringSoon = isContractExpiringSoon(contract);
            const daysUntilExpiry =
              contract.status === "active"
                ? Math.ceil(
                    (new Date(contract.end_date).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

            return (
              <TableRow
                key={contract.id}
                className={`hover:bg-muted/50 transition-colors ${
                  isExpiringSoon ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                }`}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {contract.contract_file && (
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="truncate max-w-48">{contract.name}</span>
                    {isExpiringSoon && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {daysUntilExpiry}d
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-32">
                      {contract.client_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(contract.status)}
                    className="flex items-center gap-1 w-fit"
                  >
                    {getStatusIcon(contract.status)}
                    {contract.status.charAt(0).toUpperCase() +
                      contract.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(contract.start_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(contract.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(contract.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(contract)}
                      className="h-8 px-2"
                      title="Edit contract"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(contract)}
                      className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete contract"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {contract.contract_file && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(contract)}
                        className="h-8 px-2"
                        title="Download contract"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default ContractTable;
