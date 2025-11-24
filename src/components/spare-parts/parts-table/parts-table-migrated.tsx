"use client";

import { SparePart } from "@/components/spare-parts/types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/invoice-helpers";

interface PartsTableMigratedProps {
  parts: SparePart[];
  onPartClick: (part: SparePart) => void;
  isLoading: boolean;
  onExport?: () => void;
}

// Helper function to get stock status
const getStockStatus = (part: SparePart) => {
  if (part.quantity <= 0) {
    return {
      label: "Out of Stock",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:bg-red-500/20 dark:border-red-500/30",
      iconClassName: "text-red-600 dark:text-red-400",
    };
  }
  if (part.quantity <= part.min_stock_level) {
    return {
      label: "Low Stock",
      icon: AlertTriangle,
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:border-yellow-500/30",
      iconClassName: "text-yellow-600 dark:text-yellow-400",
    };
  }
  return {
    label: "In Stock",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:bg-green-500/20 dark:border-green-500/30",
    iconClassName: "text-green-600 dark:text-green-400",
  };
};


export const PartsTableMigrated = ({
  parts,
  onPartClick,
  isLoading,
  onExport,
}: PartsTableMigratedProps) => {
  // Define columns for the DataTable
  const columns: ColumnDef<SparePart>[] = [
    {
      accessorKey: "name",
      header: "Part Name",
      cell: ({ row }: { row: any }) => {
        const part = row.original as SparePart;
        return (
          <div
            className="font-medium cursor-pointer hover:text-primary transition-colors"
            onClick={() => onPartClick(part)}
          >
            {part.name}
          </div>
        );
      },
    },
    {
      accessorKey: "part_number",
      header: "Part Number",
      cell: ({ row }: { row: any }) => {
        return (
          <div className="font-mono text-sm">
            {row.getValue("part_number")}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: { row: any }) => {
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600"
          >
            {row.getValue("category")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }: { row: any }) => {
        const quantity = row.getValue("quantity") as number;
        return (
          <div className="text-right font-semibold">
            {quantity}
          </div>
        );
      },
    },
    {
      accessorKey: "unit_price",
      header: "Price",
      cell: ({ row }: { row: any }) => {
        const price = row.getValue("unit_price") as number;
        return (
          <div className="text-right">
            {formatCurrency(price)}
          </div>
        );
      },
    },
    {
      id: "stock_status",
      header: "Stock Status",
      cell: ({ row }: { row: any }) => {
        const part = row.original as SparePart;
        const stockStatus = getStockStatus(part);
        const StatusIcon = stockStatus.icon;
        
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("h-4 w-4", stockStatus.iconClassName)} />
              <Badge
                variant="outline"
                className={cn("font-medium text-xs", stockStatus.className)}
              >
                {stockStatus.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Min:</span>
              <span>{part.min_stock_level}</span>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={parts}
      searchKey="name"
      searchPlaceholder="Search parts by name, part number, or manufacturer..."
      enableColumnVisibility
      enableExport={!!onExport}
      onExport={onExport}
      isLoading={isLoading}
      emptyMessage="No spare parts found. Create your first part to get started."
      pageSize={25}
    />
  );
};

