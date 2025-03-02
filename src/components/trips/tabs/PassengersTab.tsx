
import { useState } from "react";
import { Users, PlusCircle, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DisplayTrip } from "@/lib/types/trip";
import { useQueryClient } from "@tanstack/react-query";

interface PassengersTabProps {
  viewTrip: DisplayTrip;
  setViewTrip?: (trip: DisplayTrip) => void;
}

export function PassengersTab({ viewTrip, setViewTrip }: PassengersTabProps) {
  // Ensure we're working with an array of passengers
  const passengers = Array.isArray(viewTrip.passengers) ? viewTrip.passengers : [];
  
  const [isEditing, setIsEditing] = useState(false);
  const [newPassenger, setNewPassenger] = useState("");
  const [editedPassengers, setEditedPassengers] = useState<string[]>(passengers);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle adding a new passenger
  const handleAddPassenger = () => {
    if (!newPassenger.trim()) return;
    setEditedPassengers([...editedPassengers, newPassenger]);
    setNewPassenger("");
  };

  // Handle removing a passenger
  const handleRemovePassenger = (index: number) => {
    const updated = [...editedPassengers];
    updated.splice(index, 1);
    setEditedPassengers(updated);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
      // Only proceed if we have a setViewTrip function to update the trip
      if (!setViewTrip) {
        toast({
          title: "Cannot save changes",
          description: "View-only mode activated. Changes cannot be saved.",
          variant: "destructive",
        });
        return;
      }

      // Update the trip in the parent component
      const updatedTrip = {
        ...viewTrip,
        passengers: editedPassengers
      };
      
      // Update local state
      setViewTrip(updatedTrip);
      
      // Make API call to update the database
      const response = await fetch(`/api/trips/${viewTrip.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passengers: editedPassengers }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update passengers");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      
      toast({
        title: "Passengers updated",
        description: `Updated ${editedPassengers.length} passengers for this trip.`,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating passengers:", error);
      toast({
        title: "Error updating passengers",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedPassengers(passengers);
    setNewPassenger("");
    setIsEditing(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium">Passengers</h3>
          <Badge variant="outline" className="bg-indigo-900/40 text-indigo-300">
            {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
          </Badge>
        </div>
        {!isEditing && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
            onClick={() => setIsEditing(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Manage Passengers
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader className="pb-3 border-b border-slate-800/50">
            <CardTitle className="text-sm font-medium">Edit Passengers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={newPassenger}
                  onChange={(e) => setNewPassenger(e.target.value)}
                  placeholder="Enter passenger name"
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                />
                <Button 
                  onClick={handleAddPassenger}
                  className="bg-indigo-900/70 hover:bg-indigo-900 text-white"
                >Add</Button>
              </div>
              
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {editedPassengers.map((passenger, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-md border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-300">
                        {passenger && typeof passenger === 'string' && passenger.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-200">{passenger}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemovePassenger(index)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {editedPassengers.length === 0 && (
                  <li className="text-center py-4 text-slate-500 italic">
                    No passengers added yet
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 pt-2 border-t border-slate-800/50">
            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            <Button 
              className="bg-indigo-900/70 hover:bg-indigo-900 text-white"
              onClick={handleSaveChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {passengers.length > 0 ? (
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="pt-4">
                <ul className="divide-y divide-slate-800/50">
                  {passengers.map((passenger, index) => (
                    <li key={index} className="py-3 flex items-center space-x-3">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-300">
                        {passenger && typeof passenger === 'string' && passenger.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">{passenger}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-6 border border-dashed border-slate-800 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-slate-700" />
              <h3 className="mt-2 text-sm font-medium text-slate-400">No passengers</h3>
              <p className="mt-1 text-sm text-slate-600">
                No passengers have been added to this trip.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
