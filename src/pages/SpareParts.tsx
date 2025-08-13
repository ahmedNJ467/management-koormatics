import { useState, useMemo, useEffect } from "react";
import { SparePart } from "@/components/spare-parts/types";
import { usePartsFilter } from "@/components/spare-parts/hooks/use-parts-filter";
import { usePartsMutations } from "@/components/spare-parts/hooks/use-parts-mutations";
import { usePartsSorting } from "@/components/spare-parts/hooks/use-parts-sorting";
import { useSparePartsQuery } from "@/components/spare-parts/hooks/use-spare-parts-query";
import { PartsTabs } from "@/components/spare-parts/parts-tabs/parts-tabs";
import { AddPartDialog } from "@/components/spare-parts/dialogs/add-part-dialog";
import { EditPartDialog } from "@/components/spare-parts/dialogs/edit-part-dialog";
import { DeletePartDialog } from "@/components/spare-parts/dialogs/delete-part-dialog";
import { exportToCSV } from "@/components/reports/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Filter, Download, Package, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SpareParts = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  // Enhanced filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");

  const { toast } = useToast();
  const { sortConfig, handleSort } = usePartsSorting();
  const {
    data: spareParts = [],
    isLoading,
    isError,
  } = useSparePartsQuery(sortConfig);
  const {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    isStorageAvailable,
  } = usePartsMutations();
  const {
    searchQuery,
    setSearchQuery,
    filteredParts,
    inStockParts,
    lowStockParts,
    outOfStockParts,
  } = usePartsFilter(spareParts);

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

  const locations = useMemo(() => {
    const uniqueLocations = new Set(spareParts.map((part) => part.location));
    return Array.from(uniqueLocations).sort();
  }, [spareParts]);

  // Apply additional filters
  const enhancedFilteredParts = useMemo(() => {
    return filteredParts.filter((part) => {
      // Category filter
      if (categoryFilter !== "all" && part.category !== categoryFilter) {
        return false;
      }

      // Manufacturer filter
      if (
        manufacturerFilter !== "all" &&
        part.manufacturer !== manufacturerFilter
      ) {
        return false;
      }

      // Location filter
      if (locationFilter !== "all" && part.location !== locationFilter) {
        return false;
      }

      // Price range filter
      if (priceRangeFilter !== "all") {
        const price = part.unit_price;
        switch (priceRangeFilter) {
          case "low":
            if (price >= 50) return false;
            break;
          case "medium":
            if (price < 50 || price >= 200) return false;
            break;
          case "high":
            if (price < 200) return false;
            break;
        }
      }

      return true;
    });
  }, [
    filteredParts,
    categoryFilter,
    manufacturerFilter,
    locationFilter,
    priceRangeFilter,
  ]);

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const partsPerPage = 20;
  const totalPages = Math.ceil(
    (enhancedFilteredParts?.length || 0) / partsPerPage
  );
  const startIndex = (currentPage - 1) * partsPerPage;
  const endIndex = startIndex + partsPerPage;
  const paginatedParts =
    enhancedFilteredParts?.slice(startIndex, endIndex) || [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, manufacturerFilter, locationFilter, priceRangeFilter]);

  const openEditDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteDialogOpen(true);
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(enhancedFilteredParts, "spare-parts-inventory");
      toast({
        title: "Export successful",
        description: `Exported ${enhancedFilteredParts.length} spare parts to CSV`,
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
    setLocationFilter("all");
    setPriceRangeFilter("all");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    manufacturerFilter !== "all" ||
    locationFilter !== "all" ||
    priceRangeFilter !== "all";

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load spare parts data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Spare Parts</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Package className="h-4 w-4" /> Add Part
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part name, category, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under $50</SelectItem>
              <SelectItem value="medium">$50 - $200</SelectItem>
              <SelectItem value="high">Over $200</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4 mr-2" />
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
            {locationFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Location: {locationFilter}
                <button
                  onClick={() => setLocationFilter("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {priceRangeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Price:{" "}
                {priceRangeFilter === "low"
                  ? "Under $50"
                  : priceRangeFilter === "medium"
                  ? "$50 - $200"
                  : "Over $200"}
                <button
                  onClick={() => setPriceRangeFilter("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

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

      {/* Parts Table with Enhanced Data */}
      <PartsTabs
        filteredParts={paginatedParts}
        inStockParts={inStockParts.filter((part) =>
          enhancedFilteredParts.includes(part)
        )}
        lowStockParts={lowStockParts.filter((part) =>
          enhancedFilteredParts.includes(part)
        )}
        outOfStockParts={outOfStockParts.filter((part) =>
          enhancedFilteredParts.includes(part)
        )}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        isLoading={isLoading}
        onSort={handleSort}
        sortConfig={sortConfig}
      />

      {/* Results Count and Pagination Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-
            {Math.min(endIndex, enhancedFilteredParts?.length || 0)} of{" "}
            {enhancedFilteredParts?.length || 0} spare parts
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }

                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }

                if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }

                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              Next
            </Button>
          </div>

          {/* Timestamp at bottom */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}

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
          }
        }}
        isDeleting={deletePartMutation.isPending}
        selectedPart={selectedPart}
      />
    </div>
  );
};

export default SpareParts;
