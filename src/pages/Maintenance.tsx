
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const maintenanceRecords = [
  {
    id: "M001",
    date: "2024-02-15",
    vehicleId: "V001",
    vehicle: "Toyota Land Cruiser",
    description: "Regular Service",
    cost: 450.00,
    nextScheduled: "2024-05-15",
  },
  {
    id: "M002",
    date: "2024-02-10",
    vehicleId: "V002",
    vehicle: "Toyota Hilux",
    description: "Brake System Repair",
    cost: 280.00,
    nextScheduled: "2024-04-10",
  },
];

export default function Maintenance() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Maintenance</h2>
          <p className="text-muted-foreground">Track vehicle maintenance records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost (USD)</TableHead>
              <TableHead>Next Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenanceRecords.map((record) => (
              <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.vehicle}</TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell>${record.cost.toFixed(2)}</TableCell>
                <TableCell>{record.nextScheduled}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
