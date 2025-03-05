
import { SparePart } from "@/components/spare-parts/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowUpDown, Package } from "lucide-react";
import { PartStatusBadge } from "@/components/spare-parts/part-status-badge";

interface PartsTableProps {
  parts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
  isLoading: boolean;
  onSort: (column: string) => void;
  sortConfig: {column: string, direction: 'asc' | 'desc'};
}

export const PartsTable = ({ 
  parts, 
  onEdit, 
  onDelete, 
  isLoading, 
  onSort, 
  sortConfig 
}: PartsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No parts found</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No spare parts match your current search or filter criteria.
        </p>
      </div>
    );
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 ml-1 text-primary" /> 
      : <ArrowUpDown className="h-4 w-4 ml-1 text-primary rotate-180" />;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer w-[250px]"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Part Name <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('part_number')}
            >
              <div className="flex items-center">
                Part Number <SortIcon column="part_number" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer" 
              onClick={() => onSort('category')}
            >
              <div className="flex items-center">
                Category <SortIcon column="category" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('manufacturer')}
            >
              <div className="flex items-center">
                Manufacturer <SortIcon column="manufacturer" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => onSort('quantity')}
            >
              <div className="flex items-center justify-end">
                Stock <SortIcon column="quantity" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => onSort('unit_price')}
            >
              <div className="flex items-center justify-end">
                Price <SortIcon column="unit_price" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell className="font-medium">{part.name}</TableCell>
              <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                  {part.category}
                </Badge>
              </TableCell>
              <TableCell>{part.manufacturer}</TableCell>
              <TableCell className="text-right font-semibold">
                {part.quantity}
              </TableCell>
              <TableCell className="text-right">
                ${part.unit_price.toFixed(2)}
              </TableCell>
              <TableCell>
                <PartStatusBadge status={part.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(part)}
                    title="Edit part"
                    className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(part)}
                    title="Delete part"
                    className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
