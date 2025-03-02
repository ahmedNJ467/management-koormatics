
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  User,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { DisplayTrip, TripStatus, TripType } from "@/lib/types/trip";

interface TripTableViewProps {
  filteredTrips: DisplayTrip[] | undefined;
  formatTripId: (id: string) => string;
  formatDate: (dateStr: string) => string;
  formatTime: (timeStr?: string) => string;
  formatStatus: (status: TripStatus) => string;
  formatTripType: (type: TripType, trip?: DisplayTrip) => string;
  getStatusColor: (status: TripStatus) => string;
  getTripTypeIcon: (type: TripType) => JSX.Element;
  setViewTrip: (trip: DisplayTrip) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
  setTripToDelete: (tripId: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setBookingOpen: (open: boolean) => void;
  searchTerm: string;
  statusFilter: string;
}

const TripTableView: React.FC<TripTableViewProps> = ({
  filteredTrips,
  formatTripId,
  formatDate,
  formatTime,
  formatStatus,
  formatTripType,
  getStatusColor,
  getTripTypeIcon,
  setViewTrip,
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  setTripToAssign,
  setAssignOpen,
  updateTripStatus,
  setTripToDelete,
  setDeleteDialogOpen,
  setBookingOpen,
  searchTerm,
  statusFilter,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips && filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>
                  <div className="font-medium">{formatDate(trip.date)}</div>
                  <div className="text-sm text-gray-500">
                    {formatTime(trip.start_time)}
                    {trip.end_time && ` - ${formatTime(trip.end_time)}`}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {trip.client_type === "organization" ? (
                      <Shield className="h-4 w-4 text-blue-500" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                    <div>
                      <div className="font-medium">{trip.client_name}</div>
                      <div className="text-sm text-gray-500">{formatTripId(trip.id)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTripTypeIcon(trip.type)}
                    <span>{formatTripType(trip.type, trip)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={trip.driver_avatar || ""} />
                      <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{trip.driver_name}</span>
                  </div>
                </TableCell>
                <TableCell>{trip.vehicle_details}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(trip.status)}`}>
                    {formatStatus(trip.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                        Edit Trip
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setTripToMessage(trip);
                        setMessageOpen(true);
                      }}>
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setTripToAssign(trip);
                        setAssignOpen(true);
                      }}>
                        Assign Driver
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={trip.status === "scheduled"}
                        onClick={() => updateTripStatus(trip.id, "scheduled")}
                      >
                        Mark as Scheduled
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={trip.status === "in_progress"}
                        onClick={() => updateTripStatus(trip.id, "in_progress")}
                      >
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={trip.status === "completed"}
                        onClick={() => updateTripStatus(trip.id, "completed")}
                      >
                        Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={trip.status === "cancelled"}
                        onClick={() => updateTripStatus(trip.id, "cancelled")}
                      >
                        Mark as Cancelled
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setTripToDelete(trip.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                {searchTerm || statusFilter !== "all" ? (
                  <>
                    <div className="text-lg font-semibold">No trips found</div>
                    <div className="text-gray-500">Try adjusting your search or filter settings.</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold">No trips booked</div>
                    <div className="text-gray-500">Get started by adding your first trip.</div>
                    <Button className="mt-4" onClick={() => setBookingOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Book Trip
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripTableView;
