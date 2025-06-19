import { useState, useMemo } from "react";
import { SparePart } from "@/components/spare-parts/types";
import { usePartsFilter } from "@/components/spare-parts/hooks/use-parts-filter";
import { usePartsMutations } from "@/components/spare-parts/hooks/use-parts-mutations";
import { usePartsSorting } from "@/components/spare-parts/hooks/use-parts-sorting";
import { useSparePartsQuery } from "@/components/spare-parts/hooks/use-spare-parts-query";
import { SearchBar } from "@/components/spare-parts/search-bar";
import { HeaderActions } from "@/components/spare-parts/header-actions";
import { StatusCards } from "@/components/spare-parts/summary-cards/status-cards";
import { PartsTabs } from "@/components/spare-parts/parts-tabs/parts-tabs";
import { AddPartDialog } from "@/components/spare-parts/dialogs/add-part-dialog";
import { EditPartDialog } from "@/components/spare-parts/dialogs/edit-part-dialog";
import { DeletePartDialog } from "@/components/spare-parts/dialogs/delete-part-dialog";
import { exportToCSV } from "@/components/reports/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  Filter,
  Download,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
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

  // Calculate enhanced summary statistics
  const summaryStats = useMemo(() => {
    const totalParts = enhancedFilteredParts.length;
    const totalValue = enhancedFilteredParts.reduce(
      (sum, part) => sum + part.quantity * part.unit_price,
      0
    );
    const averagePrice =
      totalParts > 0
        ? enhancedFilteredParts.reduce(
            (sum, part) => sum + part.unit_price,
            0
          ) / totalParts
        : 0;
    const lowStockValue = lowStockParts.reduce(
      (sum, part) => sum + part.quantity * part.unit_price,
      0
    );
    const outOfStockValue = outOfStockParts.reduce(
      (sum, part) => sum + part.unit_price * part.min_stock_level,
      0
    );

    return {
      totalParts,
      totalValue,
      averagePrice,
      lowStockValue,
      outOfStockValue,
      inStockCount: inStockParts.length,
      lowStockCount: lowStockParts.length,
      outOfStockCount: outOfStockParts.length,
    };
  }, [enhancedFilteredParts, inStockParts, lowStockParts, outOfStockParts]);

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
          <h2 className="text-3xl font-semibold tracking-tight">Spare Parts</h2>
          <p className="text-muted-foreground">
            Manage your spare parts inventory and track stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-white border-white/20"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2 text-white border-white/20"
          >
            <Package className="mr-2 h-4 w-4" /> Add Part
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">
              Total Parts
            </CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">
              {summaryStats.totalParts}
            </div>
            <p className="text-xs text-blue-400/70">
              {summaryStats.inStockCount} in stock
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">
              ${summaryStats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-green-400/70">
              Avg: ${summaryStats.averagePrice.toFixed(2)}/part
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-400">
              Low Stock
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">
              {summaryStats.lowStockCount}
            </div>
            <p className="text-xs text-orange-400/70">
              ${summaryStats.lowStockValue.toFixed(2)} value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">
              Out of Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">
              {summaryStats.outOfStockCount}
            </div>
            <p className="text-xs text-red-400/70">
              ${summaryStats.outOfStockValue.toFixed(2)} needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <SearchBar searchQuery={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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

            <Select
              value={priceRangeFilter}
              onValueChange={setPriceRangeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">Under $50</SelectItem>
                <SelectItem value="medium">$50 - $200</SelectItem>
                <SelectItem value="high">Over $200</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="gap-2"
            >
              Clear Filters
            </Button>
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
        </CardContent>
      </Card>

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
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parts Inventory
            {hasActiveFilters && (
              <Badge variant="outline" className="ml-2">
                {enhancedFilteredParts.length} of {spareParts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PartsTabs
            filteredParts={enhancedFilteredParts}
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
        </CardContent>
      </Card>

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
