
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { TripAssignment } from "@/lib/types/trip";
import { Badge } from "@/components/ui/badge";
import { DisplayTrip } from "@/lib/types/trip";
import { UserPlus } from "lucide-react";

interface AssignmentsTabProps {
  assignments: TripAssignment[];
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
}

export function AssignmentsTab({ 
  assignments, 
  setTripToAssign, 
  setAssignOpen
}: AssignmentsTabProps) {
  const formatTimestamp = (timestamp: string): string => {
    return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Driver Assignments</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setAssignOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Driver
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No assignments yet
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {assignment.driver_avatar ? (
                      <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name} />
                    ) : (
                      <AvatarFallback>
                        {assignment.driver_name?.charAt(0) || 'D'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{assignment.driver_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned: {formatTimestamp(assignment.assigned_at)}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(assignment.status)}>
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
