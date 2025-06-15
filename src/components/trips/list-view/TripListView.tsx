
import { 
  Table, TableHeader, TableHead, TableRow, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { TripListItem } from "./TripListItem";
import { EmptyTripsList } from "./EmptyTripsList";

interface TripListViewProps {
  filteredTrips: DisplayTrip[] | undefined;
  setViewTrip: (trip: DisplayTrip) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToAssignVehicle: (trip: DisplayTrip) => void;
  setAssignVehicleOpen: (open: boolean) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
}

export function TripListView({ 
  filteredTrips, 
  setViewTrip, 
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  setTripToAssign,
  setAssignOpen,
  setTripToAssignVehicle,
  setAssignVehicleOpen,
  setTripToDelete,
  setDeleteDialogOpen,
  updateTripStatus
}: TripListViewProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips?.length === 0 ? (
            <EmptyTripsList />
          ) : (
            filteredTrips?.map((trip) => (
              <TripListItem
                key={trip.id}
                trip={trip}
                setViewTrip={setViewTrip}
                setEditTrip={setEditTrip}
                setTripToMessage={setTripToMessage}
                setMessageOpen={setMessageOpen}
                setTripToAssign={setTripToAssign}
                setAssignOpen={setAssignOpen}
                setTripToAssignVehicle={setTripToAssignVehicle}
                setAssignVehicleOpen={setAssignVehicleOpen}
                setTripToDelete={setTripToDelete}
                setDeleteDialogOpen={setDeleteDialogOpen}
                updateTripStatus={updateTripStatus}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
