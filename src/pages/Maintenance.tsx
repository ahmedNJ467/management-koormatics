
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Calendar } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceFormDialog } from "@/components/maintenance-form-dialog";
import type { Maintenance } from "@/lib/types";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Maintenance>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          vehicle:vehicles (
            id,
            make,
            model,
            registration
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Maintenance[];
    },
  });

  const handleMaintenanceDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    setSelectedRecord(undefined);
  };

  const filteredRecords = maintenanceRecords?.filter((record) => {
    const matchesSearch = 
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vehicle?.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.service_provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "scheduled":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Maintenance</h2>
          <p className="text-muted-foreground">Track vehicle maintenance records</p>
        </div>
        <Button onClick={() => setIsAddingRecord(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
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
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Service Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Expense (USD)</TableHead>
              <TableHead>Next Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading records...
                </TableCell>
              </TableRow>
            ) : filteredRecords?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No maintenance records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords?.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRecord(record)}
                >
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {record.vehicle
                      ? `${record.vehicle.make} ${record.vehicle.model} - ${record.vehicle.registration}`
                      : "Unknown Vehicle"}
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.service_provider || "-"}</TableCell>
                  <TableCell>
                    <span className={getStatusColor(record.status)}>
                      {record.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    ${record.cost.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {record.next_scheduled
                      ? new Date(record.next_scheduled).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MaintenanceFormDialog
        open={isAddingRecord || !!selectedRecord}
        onOpenChange={(open) => {
          setIsAddingRecord(open);
          if (!open) setSelectedRecord(undefined);
        }}
        maintenance={selectedRecord}
        onMaintenanceDeleted={handleMaintenanceDeleted}
      />
    </div>
  );
}
