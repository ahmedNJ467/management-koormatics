
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

const trips = [
  {
    id: "T001",
    date: "2024-02-15",
    client: "Acme Corporation",
    vehicle: "Toyota Land Cruiser",
    driver: "John Smith",
    type: "Airport Pickup",
    status: "Scheduled",
  },
  {
    id: "T002",
    date: "2024-02-14",
    client: "Sarah Johnson",
    vehicle: "Toyota Hilux",
    driver: "Jane Doe",
    type: "Full Day Hire",
    status: "In Progress",
  },
];

export default function Trips() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
          <p className="text-muted-foreground">Manage trip reservations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Book Trip
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{trip.id}</TableCell>
                <TableCell>{trip.date}</TableCell>
                <TableCell>{trip.client}</TableCell>
                <TableCell>{trip.vehicle}</TableCell>
                <TableCell>{trip.driver}</TableCell>
                <TableCell>{trip.type}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    trip.status === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {trip.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
