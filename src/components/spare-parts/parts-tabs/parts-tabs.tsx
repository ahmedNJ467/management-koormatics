import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartsTable } from "../parts-table/parts-table";
import { SparePart } from "../types";

interface PartsTabsProps {
  filteredParts: SparePart[];
  inStockParts: SparePart[];
  lowStockParts: SparePart[];
  outOfStockParts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
  isLoading: boolean;
  onSort: (column: string) => void;
  sortConfig: { column: string; direction: "asc" | "desc" };
}

export const PartsTabs = ({
  filteredParts,
  inStockParts,
  lowStockParts,
  outOfStockParts,
  onEdit,
  onDelete,
  isLoading,
  onSort,
  sortConfig,
}: PartsTabsProps) => {
  return (
    <div className="space-y-3">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">All ({filteredParts.length})</TabsTrigger>
          <TabsTrigger
            value="in_stock"
            className="text-green-600 dark:text-green-400"
          >
            In Stock ({inStockParts.length})
          </TabsTrigger>
          <TabsTrigger
            value="low_stock"
            className="text-yellow-600 dark:text-yellow-400"
          >
            Low Stock ({lowStockParts.length})
          </TabsTrigger>
          <TabsTrigger
            value="out_of_stock"
            className="text-red-600 dark:text-red-400"
          >
            Out of Stock ({outOfStockParts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-3">
          <PartsTable
            parts={filteredParts}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
            onSort={onSort}
            sortConfig={sortConfig}
          />
        </TabsContent>

        <TabsContent value="in_stock" className="mt-3">
          <PartsTable
            parts={inStockParts}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
            onSort={onSort}
            sortConfig={sortConfig}
          />
        </TabsContent>

        <TabsContent value="low_stock" className="mt-3">
          <PartsTable
            parts={lowStockParts}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
            onSort={onSort}
            sortConfig={sortConfig}
          />
        </TabsContent>

        <TabsContent value="out_of_stock" className="mt-3">
          <PartsTable
            parts={outOfStockParts}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
            onSort={onSort}
            sortConfig={sortConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
