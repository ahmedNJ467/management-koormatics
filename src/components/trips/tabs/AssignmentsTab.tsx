
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, AlertCircle, CheckCircle, XCircle, Users } from "lucide-react";
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
    pending: { 
      icon: <Clock className="h-4 w-4 text-amber-300" />, 
      label: "Pending",
      className: "bg-amber-900/30 text-amber-300 border-amber-800" 
    },
    accepted: { 
      icon: <CheckCircle className="h-4 w-4 text-emerald-300" />, 
      label: "Accepted",
      className: "bg-emerald-900/30 text-emerald-300 border-emerald-800" 
    },
    rejected: { 
      icon: <XCircle className="h-4 w-4 text-red-300" />, 
      label: "Rejected",
      className: "bg-red-900/30 text-red-300 border-red-800" 
    }
  };

  const handleAssignDriver = () => {
    setTripToAssign(viewTrip);
    setAssignOpen(true);
  };

  const renderDriverInfo = () => {
    if (!viewTrip.driver_name || viewTrip.driver_name === "No Driver") {
      return (
        <div className="flex flex-col items-center justify-center py-8 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
          <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
          <p className="text-center text-slate-400 mb-2">No driver assigned to this trip</p>
          <Button 
            onClick={handleAssignDriver} 
            variant="outline" 
            className="mt-2 border-purple-800 bg-purple-900/20 text-purple-300 hover:bg-purple-800/30"
          >
            <User className="mr-2 h-4 w-4" />
            Assign Driver
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
        <Avatar className="h-14 w-14 border-2 border-purple-900">
          <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
          <AvatarFallback className="bg-purple-900/50 text-purple-200">{viewTrip.driver_name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-white">{viewTrip.driver_name}</p>
          {viewTrip.driver_contact && (
            <p className="text-sm text-slate-400">{viewTrip.driver_contact}</p>
          )}
        </div>
        <Button 
          onClick={handleAssignDriver} 
          variant="outline" 
          size="sm"
          className="border-purple-800 bg-purple-900/20 text-purple-300 hover:bg-purple-800/30"
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
      <Card className="mt-6 border-slate-800/50 bg-transparent">
        <CardHeader className="pb-2 bg-slate-900/50 rounded-t-lg border-b border-slate-800/50">
          <CardTitle className="text-md flex items-center text-white">
            <Users className="h-4 w-4 mr-2 text-purple-400" />
            Passengers
          </CardTitle>
          <CardDescription className="text-slate-400">
            {viewTrip.passengers.length} passenger{viewTrip.passengers.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 bg-slate-900/30">
          <ul className="divide-y divide-slate-800/50">
            {viewTrip.passengers.map((passenger, index) => (
              <li key={index} className="py-2 px-1 flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-purple-400" />
                <span className="text-white">{passenger}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/50 overflow-hidden bg-transparent">
        <CardHeader className="pb-2 bg-slate-900/50 border-b border-slate-800/50">
          <CardTitle className="text-md flex items-center text-white">
            <User className="h-4 w-4 mr-2 text-purple-400" />
            Current Driver
          </CardTitle>
          <CardDescription className="text-slate-400">
            Driver assigned to this trip
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 bg-slate-900/30">
          {renderDriverInfo()}
        </CardContent>
      </Card>

      {renderPassengerInfo()}

      {hasAssignments && (
        <Card className="border-slate-800/50 overflow-hidden bg-transparent">
          <CardHeader className="pb-2 bg-slate-900/50 border-b border-slate-800/50">
            <CardTitle className="text-md flex items-center text-white">
              <Clock className="h-4 w-4 mr-2 text-purple-400" />
              Assignment History
            </CardTitle>
            <CardDescription className="text-slate-400">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} for this trip
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 bg-slate-900/30">
            <div className="space-y-4 divide-y divide-slate-800/50">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-start pt-4 first:pt-0">
                  <Avatar className="h-10 w-10 mr-3 mt-1 border border-slate-700">
                    <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name || "Driver"} />
                    <AvatarFallback className="bg-slate-800 text-slate-300">
                      {(assignment.driver_name || "DR").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{assignment.driver_name || "Unknown Driver"}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex items-center gap-1 ${assignmentStatuses[assignment.status].className}`}
                      >
                        {assignmentStatuses[assignment.status].icon}
                        {assignmentStatuses[assignment.status].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      Assigned on {formatDate(assignment.assigned_at)} at {formatTime(assignment.assigned_at.split('T')[1])}
                    </div>
                    {assignment.notes && (
                      <div className="text-xs mt-2 bg-slate-900/50 p-2 rounded italic text-slate-300 border border-slate-800/50">{assignment.notes}</div>
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
