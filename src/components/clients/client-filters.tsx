import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Filter,
  CheckCircle,
  Building,
  Users,
  List,
  Grid,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  withContractsOnly: boolean;
  setWithContractsOnly: (value: boolean) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export function ClientFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  withContractsOnly,
  setWithContractsOnly,
  viewMode,
  setViewMode,
}: ClientFiltersProps) {
  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setWithContractsOnly(false);
  };

  const hasActiveFilters =
    (searchTerm && searchTerm.trim() !== "") ||
    (typeFilter && typeFilter !== "all") ||
    withContractsOnly;

  return (
    <div className="space-y-4">
      {/* Search and simple filters row (mirrors Vehicles page style) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search clients by name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 border-border/50 focus:border-primary/50 transition-all duration-200"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted/50"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Type and Contracts filters */}
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-11 border-border/50 focus:border-primary/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Client Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="organization">Organizations</SelectItem>
              <SelectItem value="individual">Individuals</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={withContractsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setWithContractsOnly(!withContractsOnly)}
            className="h-11"
          >
            <CheckCircle className="h-4 w-4 mr-2" /> With Contracts
          </Button>

          {/* View Toggle (same placement as Vehicles filters) */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50 ml-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-md ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4 mr-1" /> List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-md ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4 mr-1" /> Grid
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters chips + Clear All */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {searchTerm && searchTerm.trim() !== "" && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                Search: "{searchTerm}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setSearchTerm("")}
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
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setTypeFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {withContractsOnly && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" /> With Contracts
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setWithContractsOnly(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
