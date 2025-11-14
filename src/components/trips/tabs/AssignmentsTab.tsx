
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
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
  setAssignOpen,
}: AssignmentsTabProps) {
  const hasAssignments = assignments && assignments.length > 0;
  const assignmentStatuses = {
    pending: { 
      icon: <Clock className="h-4 w-4 text-amber-500 dark:text-amber-300" />,
      label: "Pending",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300",
    },
    accepted: { 
      icon: (
        <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
      ),
      label: "Accepted",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    rejected: { 
      icon: <XCircle className="h-4 w-4 text-destructive" />,
      label: "Rejected",
      className:
        "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
    },
  };

  const handleAssignDriver = () => {
    setTripToAssign(viewTrip);
    setAssignOpen(true);
  };

  const renderDriverInfo = () => {
    if (!viewTrip.driver_name || viewTrip.driver_name === "No Driver") {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">
            No driver assigned to this trip
          </p>
          <Button 
            onClick={handleAssignDriver} 
            variant="outline" 
            className="mt-2 border-border bg-transparent text-foreground hover:bg-muted/80"
          >
            <User className="mr-2 h-4 w-4" />
            Assign Driver
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 rounded-lg border border-border/70 bg-muted/40 p-4">
        <Avatar className="h-14 w-14 border border-border">
          <AvatarImage
            src={viewTrip.driver_avatar}
            alt={viewTrip.driver_name}
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {viewTrip.driver_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-foreground">{viewTrip.driver_name}</p>
          {viewTrip.driver_contact && (
            <p className="text-sm text-muted-foreground">
              {viewTrip.driver_contact}
            </p>
          )}
        </div>
        <Button 
          onClick={handleAssignDriver} 
          variant="outline" 
          size="sm"
          className="border-border bg-transparent text-foreground hover:bg-muted/80"
        >
          Change
        </Button>
      </div>
    );
  };

  const renderPassengerInfo = () => {
    // Only show for organization clients
    if (
      viewTrip.client_type !== "organization" ||
      !viewTrip.passengers ||
      viewTrip.passengers.length === 0
    ) {
      return null;
    }

    return (
      <Card className="mt-6 border border-border/70 bg-card">
        <CardHeader className="rounded-t-lg border-b border-border/60 bg-muted/40 pb-2">
          <CardTitle className="text-md flex items-center text-foreground">
            <Users className="mr-2 h-4 w-4 text-primary" />
            Passengers
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {viewTrip.passengers.length} passenger
            {viewTrip.passengers.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="divide-y divide-border/60">
            {viewTrip.passengers.map((passenger, index) => (
              <li
                key={index}
                className="flex items-center gap-3 py-2 px-1 text-sm"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="text-foreground">{passenger}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-border/70 bg-card">
        <CardHeader className="border-b border-border/60 bg-muted/40 pb-2">
          <CardTitle className="text-md flex items-center text-foreground">
            <User className="mr-2 h-4 w-4 text-primary" />
            Current Driver
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Driver assigned to this trip
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">{renderDriverInfo()}</CardContent>
      </Card>

      {renderPassengerInfo()}

      {hasAssignments && (
        <Card className="overflow-hidden border border-border/70 bg-card">
          <CardHeader className="border-b border-border/60 bg-muted/40 pb-2">
            <CardTitle className="text-md flex items-center text-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Assignment History
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {assignments.length} assignment
              {assignments.length !== 1 ? "s" : ""} for this trip
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4 divide-y divide-border/60">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start pt-4 first:pt-0"
                >
                  <Avatar className="mr-3 mt-1 h-10 w-10 border border-border/70">
                    <AvatarImage
                      src={assignment.driver_avatar}
                      alt={assignment.driver_name || "Driver"}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {(assignment.driver_name || "DR")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {assignment.driver_name || "Unknown Driver"}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 text-xs ${assignmentStatuses[assignment.status].className}`}
                      >
                        {assignmentStatuses[assignment.status].icon}
                        {assignmentStatuses[assignment.status].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigned on {formatDate(assignment.assigned_at)} at{" "}
                      {formatTime(assignment.assigned_at.split("T")[1])}
                    </div>
                    {assignment.notes && (
                      <div className="mt-2 rounded border border-border/60 bg-muted/40 p-2 text-xs italic text-muted-foreground">
                        {assignment.notes}
                      </div>
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
