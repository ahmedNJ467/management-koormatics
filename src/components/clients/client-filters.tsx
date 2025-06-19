import { Input } from "@/components/ui/input";
import { Search, X, Filter, CheckCircle, Building, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterPresets } from "@/components/advanced-filters/FilterPresets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ClientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
}

export function ClientFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
}: ClientFiltersProps) {
  const currentFilters = {
    search: searchTerm,
    type: typeFilter,
  };

  const handleApplyPreset = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setTypeFilter(filters.type || "all");
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setTypeFilter(filters.type || "all");
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
  };

  // Count active filters
  const activeFiltersCount = [
    searchTerm && searchTerm.trim() !== "",
    typeFilter && typeFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-10 h-11"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 h-11">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  All Types
                </div>
              </SelectItem>
              <SelectItem value="organization">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  Organizations
                </div>
              </SelectItem>
              <SelectItem value="individual">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  Individuals
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="h-11 px-3"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Presets */}
        <FilterPresets
          currentFilters={currentFilters}
          onApplyPreset={handleApplyPreset}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Card className="bg-muted/30 border-muted">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">
                  Active filters:
                </span>

                {searchTerm && searchTerm.trim() !== "" && (
                  <Badge variant="secondary" className="gap-1">
                    <Search className="h-3 w-3" />
                    Search: "{searchTerm}"
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {typeFilter && typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {typeFilter === "organization" ? (
                      <Building className="h-3 w-3" />
                    ) : (
                      <Users className="h-3 w-3" />
                    )}
                    Type:{" "}
                    {typeFilter === "organization"
                      ? "Organizations"
                      : "Individuals"}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTypeFilter("all")}
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                Clear all ({activeFiltersCount})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Quick filters:
        </span>

        <Button
          variant={typeFilter === "organization" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setTypeFilter(
              typeFilter === "organization" ? "all" : "organization"
            )
          }
          className="h-8"
        >
          <Building className="h-3 w-3 mr-1" />
          Organizations
        </Button>

        <Button
          variant={typeFilter === "individual" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setTypeFilter(typeFilter === "individual" ? "all" : "individual")
          }
          className="h-8"
        >
          <Users className="h-3 w-3 mr-1" />
          Individuals
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // This would filter for clients with active contracts - we'd need to add this filter state
            // For now, it's just a visual placeholder
          }}
          className="h-8"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          With Contracts
        </Button>
      </div>
    </div>
  );
}
