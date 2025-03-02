
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatDate, formatTime } from "@/components/trips/utils";
import { DisplayTrip } from "@/lib/types/trip";
import { TripAssignment } from "@/lib/types/trip/communication";
import { Driver } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AssignmentsTabProps {
  viewTrip: DisplayTrip;
  assignments: TripAssignment[];
  drivers: Driver[];
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
}

export function AssignmentsTab({ 
  viewTrip, 
  assignments, 
  drivers,
  setTripToAssign,
  setAssignOpen
}: AssignmentsTabProps) {
  const hasAssignments = assignments && assignments.length > 0;
  const assignmentStatuses = {
    pending: { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: "Pending" },
    accepted: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: "Accepted" },
    rejected: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: "Rejected" }
  };

  const handleAssignDriver = () => {
    setTripToAssign(viewTrip);
    setAssignOpen(true);
  };

  const renderDriverInfo = () => {
    if (!viewTrip.driver_name || viewTrip.driver_name === "No Driver") {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-center text-muted-foreground">No driver assigned</p>
          <Button 
            onClick={handleAssignDriver} 
            variant="outline" 
            className="mt-4"
          >
            <User className="mr-2 h-4 w-4" />
            Assign Driver
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4 p-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
          <AvatarFallback>{viewTrip.driver_name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{viewTrip.driver_name}</p>
          {viewTrip.driver_contact && (
            <p className="text-xs text-muted-foreground">{viewTrip.driver_contact}</p>
          )}
        </div>
        <Button 
          onClick={handleAssignDriver} 
          variant="outline" 
          size="sm"
        >
          Change
        </Button>
      </div>
    );
  };

  const renderPassengerInfo = () => {
    // Only show for organization clients
    if (viewTrip.client_type !== "organization" || !viewTrip.passengers || viewTrip.passengers.length === 0) {
      return null;
    }

    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Passengers</CardTitle>
          <CardDescription>
            {viewTrip.passengers.length} passenger{viewTrip.passengers.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {viewTrip.passengers.map((passenger, index) => (
              <li key={index} className="text-sm flex items-center gap-2 pb-2 border-b last:border-0">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{passenger}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Current Driver</CardTitle>
          <CardDescription>
            Driver assigned to this trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderDriverInfo()}
        </CardContent>
      </Card>

      {renderPassengerInfo()}

      {hasAssignments && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Assignment History</CardTitle>
            <CardDescription>
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} for this trip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-start border-b pb-3 last:border-0">
                  <Avatar className="h-8 w-8 mr-3 mt-1">
                    <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name || "Driver"} />
                    <AvatarFallback>
                      {(assignment.driver_name || "DR").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{assignment.driver_name || "Unknown Driver"}</span>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {assignmentStatuses[assignment.status].icon}
                        {assignmentStatuses[assignment.status].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigned on {formatDate(assignment.assigned_at)} at {formatTime(assignment.assigned_at.split('T')[1])}
                    </div>
                    {assignment.notes && (
                      <div className="text-xs mt-1 italic">{assignment.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
