
import { useState } from "react";
import { format } from "date-fns";
import { 
  Table, TableHeader, TableHead, TableRow, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DisplayTrip, TripStatus, TripType } from "@/lib/types/trip";
import { parsePassengers } from "@/components/trips/utils";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  FileText, MoreHorizontal, MessageCircle, User, Calendar,
  Clock, Check, X, Trash, MapPin, ArrowRight, Users
} from "lucide-react";
import { TripTypeIcon } from "./TripTypeIcon";

interface TripListViewProps {
  filteredTrips: DisplayTrip[] | undefined;
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

export function TripListView({ 
  filteredTrips, 
  setViewTrip, 
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  setTripToAssign,
  setAssignOpen,
  setTripToDelete,
  setDeleteDialogOpen,
  updateTripStatus
}: TripListViewProps) {
  
  // Format status for display
  const formatStatus = (status: TripStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Format trip type for display
  const formatTripType = (type: TripType, trip?: DisplayTrip): string => {
    if (trip?.ui_service_type) {
      // Custom labels for UI service types
      const labels: Record<string, string> = {
        "airport_pickup": "Airport Pickup",
        "airport_dropoff": "Airport Dropoff",
        "round_trip": "Round Trip",
        "security_escort": "Security Escort",
        "one_way": "One Way Transfer",
        "full_day_hire": "Full Day Hire"
      };
      
      if (trip.ui_service_type in labels) {
        return labels[trip.ui_service_type];
      }
    }
    
    // Fallback
    return type.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Format trip ID to show first 8 characters
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };
  
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
  };
  
  const getStatusColor = (status: TripStatus): string => {
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
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No trips found. Try adjusting your search or create a new trip.
              </TableCell>
            </TableRow>
          ) : (
            filteredTrips?.map((trip) => {
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
                      {formatTripType(trip.type, trip)} 
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Edit Trip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTripToMessage(trip);
                            setMessageOpen(true);
                          }}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTripToAssign(trip);
                            setAssignOpen(true);
                          }}>
                            <User className="h-4 w-4 mr-2" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {/* Status change options */}
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>

                          {trip.status !== "scheduled" && (
                            <DropdownMenuItem 
                              onClick={() => updateTripStatus(trip.id, "scheduled")}
                              className="text-blue-600"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Set as Scheduled
                            </DropdownMenuItem>
                          )}

                          {trip.status !== "in_progress" && (
                            <DropdownMenuItem 
                              onClick={() => updateTripStatus(trip.id, "in_progress")}
                              className="text-yellow-600"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Set as In Progress
                            </DropdownMenuItem>
                          )}

                          {trip.status !== "completed" && (
                            <DropdownMenuItem 
                              onClick={() => updateTripStatus(trip.id, "completed")}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}

                          {trip.status !== "cancelled" && (
                            <DropdownMenuItem 
                              onClick={() => updateTripStatus(trip.id, "cancelled")}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Trip
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              setTripToDelete(trip.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
