
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

const vehicles = [
  {
    id: "V001",
    type: "Armoured",
    make: "Toyota",
    model: "Land Cruiser",
    status: "Active",
    registration: "KBZ 123A",
    insuranceExpiry: "2024-12-31",
  },
  {
    id: "V002",
    type: "Soft Skin",
    make: "Toyota",
    model: "Hilux",
    status: "In Service",
    registration: "KCA 456B",
    insuranceExpiry: "2024-10-15",
  },
];

export default function Vehicles() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Insurance Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{vehicle.id}</TableCell>
                <TableCell>{vehicle.type}</TableCell>
                <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
                <TableCell>{vehicle.status}</TableCell>
                <TableCell>{vehicle.registration}</TableCell>
                <TableCell>{vehicle.insuranceExpiry}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
