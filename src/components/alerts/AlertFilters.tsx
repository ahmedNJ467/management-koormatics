
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AlertFiltersProps {
  onFilterChange: (filters: { resolved: boolean; priority: string; type: string }) => void;
}

export const AlertFilters = ({ onFilterChange }: AlertFiltersProps) => {
  const [status, setStatus] = useState<"active" | "resolved">("active");
  const [priority, setPriority] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const handleStatusChange = (value: string) => {
    const newStatus = value as "active" | "resolved";
    setStatus(newStatus);
    onFilterChange({
      resolved: newStatus === "resolved",
      priority,
      type,
    });
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    onFilterChange({
      resolved: status === "resolved",
      priority: value === "all" ? "" : value,
      type,
    });
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    onFilterChange({
      resolved: status === "resolved",
      priority,
      type: value === "all" ? "" : value,
    });
  };

  const handleReset = () => {
    setStatus("active");
    setPriority("all");
    setType("all");
    onFilterChange({
      resolved: false,
      priority: "",
      type: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs defaultValue="active" value={status} onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="trip">Trip</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="fuel">Fuel</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
