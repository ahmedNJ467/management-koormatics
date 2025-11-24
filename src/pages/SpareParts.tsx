import { useState, useMemo } from "react";
import { SparePart } from "@/components/spare-parts/types";
import { usePartsMutations } from "@/components/spare-parts/hooks/use-parts-mutations";
import { useSparePartsQuery } from "@/components/spare-parts/hooks/use-spare-parts-query";
import { PartsTableMigrated } from "@/components/spare-parts/parts-table/parts-table-migrated";
import { AddPartDialog } from "@/components/spare-parts/dialogs/add-part-dialog";
import { EditPartDialog } from "@/components/spare-parts/dialogs/edit-part-dialog";
import { DeletePartDialog } from "@/components/spare-parts/dialogs/delete-part-dialog";
import { PartDetailsDialog } from "@/components/spare-parts/dialogs/part-details-dialog";
import { exportToCSV } from "@/components/reports/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SpareParts = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  // Simplified filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");

  const { toast } = useToast();
  const {
    data: spareParts = [],
    isLoading,
    isError,
  } = useSparePartsQuery({ column: "name", direction: "asc" });
  const {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    isStorageAvailable,
  } = usePartsMutations();

  // Get unique values for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set(spareParts.map((part) => part.category));
    return Array.from(uniqueCategories).sort();
  }, [spareParts]);

  const manufacturers = useMemo(() => {
    const uniqueManufacturers = new Set(
      spareParts.map((part) => part.manufacturer)
    );
    return Array.from(uniqueManufacturers).sort();
  }, [spareParts]);

  // Apply category and manufacturer filters
  // Note: DataTable handles search and pagination internally
  const filteredParts = useMemo(() => {
    return spareParts.filter((part) => {
      if (categoryFilter !== "all" && part.category !== categoryFilter) {
        return false;
      }
      if (
        manufacturerFilter !== "all" &&
        part.manufacturer !== manufacturerFilter
      ) {
        return false;
      }
      return true;
    });
  }, [spareParts, categoryFilter, manufacturerFilter]);

  const openEditDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
    setIsDetailsDialogOpen(false); // Close details dialog when opening edit
  };

  const openDeleteDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteDialogOpen(true);
    setIsDetailsDialogOpen(false); // Close details dialog when opening delete
  };

  const handlePartClick = (part: SparePart) => {
    setSelectedPart(part);
    setIsDetailsDialogOpen(true);
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(filteredParts, "spare-parts-inventory");
      toast({
        title: "Export successful",
        description: `Exported ${filteredParts.length} spare parts to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setManufacturerFilter("all");
  };

  const hasActiveFilters =
    categoryFilter !== "all" || manufacturerFilter !== "all";

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 px-6 space-y-6">
          <div className="border-b border-border pb-4 pt-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Error</h1>
              <p className="text-destructive text-sm mt-1">
                Failed to load spare parts data. Please try refreshing the page.
              </p>
            </div>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load spare parts data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Spare Parts
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                Export
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                Add Part
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={manufacturerFilter}
            onValueChange={setManufacturerFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Manufacturers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Manufacturers</SelectItem>
              {manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Category: {categoryFilter}
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {manufacturerFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Manufacturer: {manufacturerFilter}
                <button
                  onClick={() => setManufacturerFilter("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Storage Alert */}
        {isStorageAvailable === false && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Storage Service Issue</AlertTitle>
            <AlertDescription>
              Image uploads are disabled because the storage service is not
              properly configured. Parts can still be added and edited, but
              without images.
            </AlertDescription>
          </Alert>
        )}

        {/* Parts Table */}
        <PartsTableMigrated
          parts={filteredParts}
          onPartClick={handlePartClick}
          isLoading={isLoading}
          onExport={handleExportCSV}
        />

        {/* Dialogs */}
        <AddPartDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={(data) => {
            addPartMutation.mutate(data);
            setIsAddDialogOpen(false);
          }}
          isSubmitting={addPartMutation.isPending}
        />

        <EditPartDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(data) => {
            if (selectedPart) {
              updatePartMutation.mutate({
                updatedPart: data,
                partId: selectedPart.id,
              });
              setIsEditDialogOpen(false);
            }
          }}
          isSubmitting={updatePartMutation.isPending}
          selectedPart={selectedPart}
        />

        <DeletePartDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => {
            if (selectedPart) {
              deletePartMutation.mutate(selectedPart.id);
              setIsDeleteDialogOpen(false);
              setSelectedPart(null);
            }
          }}
          isDeleting={deletePartMutation.isPending}
          selectedPart={selectedPart}
        />

        <PartDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          part={selectedPart}
          onEdit={() => {
            if (selectedPart) {
              openEditDialog(selectedPart);
            }
          }}
          onDelete={() => {
            if (selectedPart) {
              openDeleteDialog(selectedPart);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SpareParts;
