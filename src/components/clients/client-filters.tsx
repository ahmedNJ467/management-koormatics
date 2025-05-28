
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterPresets } from "@/components/advanced-filters/FilterPresets";

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
  setTypeFilter 
}: ClientFiltersProps) {
  const currentFilters = {
    search: searchTerm,
    type: typeFilter
  };

  const handleApplyPreset = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setTypeFilter(filters.type || "all");
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setTypeFilter(filters.type || "all");
  };

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="organization">Organization</SelectItem>
          <SelectItem value="individual">Individual</SelectItem>
        </SelectContent>
      </Select>
      
      <FilterPresets
        currentFilters={currentFilters}
        onApplyPreset={handleApplyPreset}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}
