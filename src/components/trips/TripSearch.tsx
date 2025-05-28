
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { FilterPresets } from "@/components/advanced-filters/FilterPresets";

interface TripSearchProps {
  searchTerm: string;
  statusFilter: string;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
}

export function TripSearch({ 
  searchTerm, 
  statusFilter, 
  setSearchTerm, 
  setStatusFilter 
}: TripSearchProps) {
  const currentFilters = {
    search: searchTerm,
    status: statusFilter
  };

  const handleApplyPreset = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setStatusFilter(filters.status || "all");
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setSearchTerm(filters.search || "");
    setStatusFilter(filters.status || "all");
  };

  return (
    <div className="flex gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search trips..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
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
