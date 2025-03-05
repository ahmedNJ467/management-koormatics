
import { FileText, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contract } from "@/pages/Contracts";

interface ContractTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onDownload: (contract: Contract) => void;
}

const ContractTable = ({ contracts, onEdit, onDelete, onDownload }: ContractTableProps) => {
  if (contracts.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No contracts found</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">{contract.name}</TableCell>
              <TableCell>{contract.client_name}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    contract.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                      : contract.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                  }`}
                >
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(contract)}
                    title="Edit contract"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(contract)}
                    title="Delete contract"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {contract.contract_file && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(contract)}
                      title="Download contract"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default ContractTable;
