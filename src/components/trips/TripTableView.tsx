
import React from "react";
import { Calendar, MessageSquare, MoreHorizontal, PenSquare, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { Plane, ArrowRight, Clock } from "lucide-react";
import { 
  formatTripId, 
  formatStatus, 
  formatTripType, 
  formatDate, 
  formatTime, 
  getStatusColor, 
  getTripTypeIcon
} from "@/components/trips/utils/trip-helpers";

interface TripTableViewProps {
  filteredTrips: DisplayTrip[];
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
  // Helper function to render the appropriate icon based on trip type
  const renderTripTypeIcon = (type: any) => {
    const iconInfo = getTripTypeIcon(type);
    
    switch (iconInfo.icon) {
      case "plane":
        return <Plane className={iconInfo.size} />;
      case "clock":
        return <Clock className={iconInfo.size} />;
      case "calendar":
        return <Calendar className={iconInfo.size} />;
      case "arrow-right":
      default:
        return <ArrowRight className={iconInfo.size} />;
    }
  };

  if (!filteredTrips?.length) {
    return (
      <div className="border rounded-md p-8 text-center">
        <h3 className="text-lg font-medium">No trips found</h3>
        <p className="text-muted-foreground mt-1">
          {searchTerm || statusFilter !== "all"
            ? "Try changing your search or filter criteria"
            : "Get started by creating a new trip booking"}
        </p>
        <Button className="mt-4" onClick={() => setBookingOpen(true)}>Book New Trip</Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips.map((trip) => (
            <TableRow key={trip.id} onClick={() => setViewTrip(trip)} className="cursor-pointer hover:bg-muted/50">
              <TableCell>{formatTripId(trip.id)}</TableCell>
              <TableCell>{formatDate(trip.date)}</TableCell>
              <TableCell>
                {formatTime(trip.start_time)}
                {trip.end_time && (
                  <span> - {formatTime(trip.end_time)}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {renderTripTypeIcon(trip.type)}
                  <span>{formatTripType(trip.type, trip)}</span>
                </div>
              </TableCell>
              <TableCell>{trip.client_name}</TableCell>
              <TableCell>{trip.driver_name}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(trip.status)}>
                  {formatStatus(trip.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setEditTrip(trip);
                    }}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setTripToMessage(trip);
                      setMessageOpen(true);
                    }}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setTripToAssign(trip);
                      setAssignOpen(true);
                    }}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Driver
                    </DropdownMenuItem>
                    
                    {trip.status !== "in_progress" && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateTripStatus(trip.id, "in_progress");
                      }}>
                        Start Trip
                      </DropdownMenuItem>
                    )}
                    
                    {trip.status !== "completed" && trip.status !== "cancelled" && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateTripStatus(trip.id, "completed");
                      }}>
                        Complete Trip
                      </DropdownMenuItem>
                    )}
                    
                    {trip.status !== "cancelled" && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateTripStatus(trip.id, "cancelled");
                      }}>
                        Cancel Trip
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTripToDelete(trip.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripTableView;
