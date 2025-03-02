
import { format } from "date-fns";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  FileText, MoreHorizontal, MapPin, ArrowRight, Users
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { TripTypeIcon } from "../TripTypeIcon";
import { parsePassengers } from "../utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { TripItemActions } from "./TripItemActions";

export const formatTripId = (id: string): string => {
  return id.substring(0, 8).toUpperCase();
};

export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "MMM d, yyyy");
};

export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return "";
  return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
};

export const getStatusColor = (status: TripStatus): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const formatStatus = (status: TripStatus): string => {
  return status.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Format trip type for display
export const formatTripType = (type: string, uiServiceType?: string): string => {
  if (uiServiceType) {
    // Custom labels for UI service types
    const labels: Record<string, string> = {
      "airport_pickup": "Airport Pickup",
      "airport_dropoff": "Airport Dropoff",
      "round_trip": "Round Trip",
      "security_escort": "Security Escort",
      "one_way": "One Way Transfer",
      "full_day_hire": "Full Day Hire"
    };
    
    if (uiServiceType in labels) {
      return labels[uiServiceType];
    }
  }
  
  // Fallback
  return type.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface TripListItemProps {
  trip: DisplayTrip;
  setViewTrip: (trip: DisplayTrip) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
}

export function TripListItem({
  trip,
  setViewTrip,
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  setTripToAssign,
  setAssignOpen,
  setTripToDelete,
  setDeleteDialogOpen,
  updateTripStatus
}: TripListItemProps) {
  // Get passengers from both the dedicated passengers array and notes
  const passengersFromArray = Array.isArray(trip.passengers) ? trip.passengers : [];
  const passengersFromNotes = parsePassengers(trip.notes);
  
  // Combine both sources, remove duplicates
  const allPassengers = [...new Set([...passengersFromArray, ...passengersFromNotes])];
  const hasPassengers = allPassengers.length > 0;

  return (
    <TableRow key={trip.id} className="group">
      <TableCell className="font-medium">
        {formatTripId(trip.id)}
      </TableCell>
      <TableCell>
        <div className="font-medium">{formatDate(trip.date)}</div>
        <div className="text-sm text-muted-foreground">{formatTime(trip.time)}</div>
        {trip.return_time && (
          <div className="text-xs text-muted-foreground">Return: {formatTime(trip.return_time)}</div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">{trip.client_name}</div>
        {trip.client_type === "organization" && (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="text-xs">Organization</Badge>
            {hasPassengers && (
              <div className="mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {allPassengers.length === 1 ? (
                    <span title={allPassengers[0]}>
                      {allPassengers[0].length > 15 
                        ? `${allPassengers[0].substring(0, 15)}...` 
                        : allPassengers[0]}
                    </span>
                  ) : (
                    <span title={allPassengers.join(', ')}>
                      {allPassengers.length} passengers
                    </span>
                  )}
                </div>
                {allPassengers.length > 1 && (
                  <div className="mt-1 text-xs text-muted-foreground ml-4">
                    {allPassengers.slice(0, 2).map((passenger, i) => (
                      <div key={i} className="truncate max-w-[120px]" title={passenger}>
                        - {passenger.length > 15 ? `${passenger.substring(0, 15)}...` : passenger}
                      </div>
                    ))}
                    {allPassengers.length > 2 && (
                      <div className="text-xs italic">+ {allPassengers.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <TripTypeIcon type={trip.type} />
          {formatTripType(trip.type, trip.ui_service_type)} 
        </div>
      </TableCell>
      <TableCell className="max-w-[200px]">
        {trip.pickup_location && (
          <div className="flex items-start gap-1 truncate">
            <MapPin className="h-3 w-3 mt-1 shrink-0" />
            <span className="truncate">{trip.pickup_location}</span>
          </div>
        )}
        {trip.dropoff_location && (
          <div className="flex items-start gap-1 truncate">
            <ArrowRight className="h-3 w-3 mt-1 shrink-0" />
            <span className="truncate">{trip.dropoff_location}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {trip.driver_avatar ? (
              <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {trip.driver_name?.charAt(0) || 'D'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-medium text-sm">{trip.driver_name}</div>
            {trip.driver_contact && (
              <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                {trip.driver_contact}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(trip.status)}>
          {formatStatus(trip.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewTrip(trip)}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <TripItemActions 
                trip={trip}
                setViewTrip={setViewTrip}
                setEditTrip={setEditTrip}
                setTripToMessage={setTripToMessage}
                setMessageOpen={setMessageOpen}
                setTripToAssign={setTripToAssign}
                setAssignOpen={setAssignOpen}
                setTripToDelete={setTripToDelete}
                setDeleteDialogOpen={setDeleteDialogOpen}
                updateTripStatus={updateTripStatus}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
