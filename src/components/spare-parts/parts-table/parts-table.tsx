import { SparePart } from "@/components/spare-parts/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowUpDown } from "lucide-react";

interface PartsTableProps {
  parts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
  isLoading: boolean;
  onSort: (column: string) => void;
  sortConfig: { column: string; direction: "asc" | "desc" };
}

export const PartsTable = ({
  parts,
  onEdit,
  onDelete,
  isLoading,
  onSort,
  sortConfig,
}: PartsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              No parts found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No spare parts match your current search or filter criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUpDown className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowUpDown className="h-3 w-3 ml-1 text-primary rotate-180" />
    );
  };

  const getStockStatus = (part: SparePart) => {
    if (part.quantity <= 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (part.quantity <= part.min_stock_level) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        color: "text-yellow-600 dark:text-yellow-400",
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      color: "text-green-600 dark:text-green-400",
    };
  };

  return (
    <div className="border rounded overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer min-w-[200px]"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center">
                Part Name <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer min-w-[140px]"
              onClick={() => onSort("part_number")}
            >
              <div className="flex items-center">
                Part Number <SortIcon column="part_number" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer min-w-[120px]"
              onClick={() => onSort("category")}
            >
              <div className="flex items-center">
                Category <SortIcon column="category" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer min-w-[140px]"
              onClick={() => onSort("manufacturer")}
            >
              <div className="flex items-center">
                Manufacturer <SortIcon column="manufacturer" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer min-w-[100px]"
              onClick={() => onSort("quantity")}
            >
              <div className="flex items-center justify-end">
                Stock <SortIcon column="quantity" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer min-w-[100px]"
              onClick={() => onSort("unit_price")}
            >
              <div className="flex items-center justify-end">
                Price <SortIcon column="unit_price" />
              </div>
            </TableHead>
            <TableHead className="min-w-[120px]">Stock Status</TableHead>
            <TableHead className="min-w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => {
            const stockStatus = getStockStatus(part);
            return (
              <TableRow
                key={part.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <TableCell className="font-medium py-3">{part.name}</TableCell>
                <TableCell className="font-mono text-sm py-3">
                  {part.part_number}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600"
                  >
                    {part.category}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">{part.manufacturer}</TableCell>
                <TableCell className="text-right font-semibold py-3">
                  {part.quantity}
                </TableCell>
                <TableCell className="text-right py-3">
                  ${part.unit_price.toFixed(2)}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={stockStatus.variant}
                      className={stockStatus.color}
                    >
                      {stockStatus.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Min: {part.min_stock_level}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(part)}
                      title="Edit part"
                      className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(part)}
                      title="Delete part"
                      className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
