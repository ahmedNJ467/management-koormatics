
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { TripAssignment } from "@/lib/types/trip";
import { Badge } from "@/components/ui/badge";
import { DisplayTrip } from "@/lib/types/trip";
import { UserPlus, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Driver } from "@/lib/types";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [assignmentNote, setAssignmentNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAssign = async () => {
    if (!selectedDriver) {
      toast({
        title: "Error",
        description: "Please select a driver",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("trip_assignments")
        .insert({
          trip_id: viewTrip.id,
          driver_id: selectedDriver,
          status: "pending",
          notes: assignmentNote || null,
        });

      if (error) throw error;

      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });

      // Reset form
      setSelectedDriver("");
      setAssignmentNote("");
      setIsAssigning(false);
      
      // Refresh assignments data
      queryClient.invalidateQueries({ queryKey: ["tripAssignments", viewTrip.id] });
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Driver Assignments</CardTitle>
        <div className="flex space-x-2">
          {!isAssigning ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAssigning(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Driver
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAssigning(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAssigning && (
          <div className="border rounded-md p-4 space-y-4 bg-muted/20">
            <h3 className="font-medium">Assign a driver to this trip</h3>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Select Driver</p>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Notes (optional)</p>
              <Textarea 
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="Add notes about this assignment"
                className="h-24"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleAssign}
                disabled={isSubmitting || !selectedDriver}
              >
                {isSubmitting ? "Assigning..." : "Assign Driver"}
              </Button>
            </div>
          </div>
        )}
        
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
