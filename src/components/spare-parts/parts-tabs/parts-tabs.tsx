
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  sortConfig: {column: string, direction: 'asc' | 'desc'};
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
  sortConfig
}: PartsTabsProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Parts Inventory</CardTitle>
        <CardDescription>
          Manage your spare parts inventory, track stock levels, and maintain part information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 grid grid-cols-4 md:w-auto">
            <TabsTrigger value="all">All ({filteredParts.length})</TabsTrigger>
            <TabsTrigger value="in_stock" className="text-green-600">In Stock ({inStockParts.length})</TabsTrigger>
            <TabsTrigger value="low_stock" className="text-yellow-600">Low Stock ({lowStockParts.length})</TabsTrigger>
            <TabsTrigger value="out_of_stock" className="text-red-600">Out of Stock ({outOfStockParts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <PartsTable
              parts={filteredParts}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
              onSort={onSort}
              sortConfig={sortConfig}
            />
          </TabsContent>

          <TabsContent value="in_stock">
            <PartsTable
              parts={inStockParts}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
              onSort={onSort}
              sortConfig={sortConfig}
            />
          </TabsContent>

          <TabsContent value="low_stock">
            <PartsTable
              parts={lowStockParts}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
              onSort={onSort}
              sortConfig={sortConfig}
            />
          </TabsContent>

          <TabsContent value="out_of_stock">
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
      </CardContent>
    </Card>
  );
};
