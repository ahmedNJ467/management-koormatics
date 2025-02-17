
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

const fuelLogs = [
  {
    id: "F001",
    date: "2024-02-15",
    vehicleId: "V001",
    vehicle: "Toyota Land Cruiser",
    fuelType: "Diesel",
    volume: 65.5,
    cost: 98.25,
    mileage: 45280,
  },
  {
    id: "F002",
    date: "2024-02-14",
    vehicleId: "V002",
    vehicle: "Toyota Hilux",
    fuelType: "Diesel",
    volume: 45.0,
    cost: 67.50,
    mileage: 32150,
  },
];

export default function FuelLogs() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Fuel Logs</h2>
          <p className="text-muted-foreground">Track fuel consumption and costs</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Log
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead>Volume (L)</TableHead>
              <TableHead>Cost (USD)</TableHead>
              <TableHead>Mileage (km)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fuelLogs.map((log) => (
              <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{log.date}</TableCell>
                <TableCell>{log.vehicle}</TableCell>
                <TableCell>{log.fuelType}</TableCell>
                <TableCell>{log.volume.toFixed(1)}</TableCell>
                <TableCell>${log.cost.toFixed(2)}</TableCell>
                <TableCell>{log.mileage.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
