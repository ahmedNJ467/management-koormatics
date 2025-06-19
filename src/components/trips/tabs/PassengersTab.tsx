import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash,
  UserCircle,
  X,
  FileText,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PassengersTabProps {
  viewTrip: DisplayTrip;
  setViewTrip: (trip: DisplayTrip) => void;
  queryClient: QueryClient;
}

export function PassengersTab({
  viewTrip,
  setViewTrip,
  queryClient,
}: PassengersTabProps) {
  const { toast } = useToast();
  const [passengers, setPassengers] = useState<string[]>(
    Array.isArray(viewTrip.passengers) ? [...viewTrip.passengers] : []
  );
  const [newPassenger, setNewPassenger] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPassengers(
      Array.isArray(viewTrip.passengers) ? [...viewTrip.passengers] : []
    );
    setNewPassenger("");
    setIsEditing(false);
  };

  const addPassenger = () => {
    if (newPassenger.trim()) {
      setPassengers([...passengers, newPassenger.trim()]);
      setNewPassenger("");
    }
  };

  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newPassenger.trim()) {
      e.preventDefault();
      addPassenger();
    }
  };

  const savePassengers = async () => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({
          passengers: passengers,
        })
        .eq("id", viewTrip.id);

      if (error) throw error;

      // Update local state
      setViewTrip({
        ...viewTrip,
        passengers: [...passengers],
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["trips"] });

      toast({
        title: "Passengers updated",
        description: "The passenger list has been updated successfully",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving passengers:", error);
      toast({
        title: "Error",
        description: "Failed to update passengers",
        variant: "destructive",
      });
    }
  };

  // Show passenger management for all clients now

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Passengers</h3>
        <div className="space-x-2">
          {!isEditing ? (
            <Button size="sm" onClick={startEditing}>
              Edit Passengers
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button size="sm" onClick={savePassengers}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Add passenger name"
            value={newPassenger}
            onChange={(e) => setNewPassenger(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            onClick={addPassenger}
            disabled={!newPassenger.trim()}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {passengers.length > 0 ? (
          passengers.map((passenger, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-md bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span>{passenger}</span>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePassenger(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <UserCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No passengers added to this trip.</p>
            {isEditing && (
              <p className="text-sm mt-1">
                Use the input above to add passengers.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Documents Section for Airport Services */}
      {(viewTrip.type === "airport_pickup" ||
        viewTrip.type === "airport_dropoff") &&
        ((viewTrip.passport_documents &&
          viewTrip.passport_documents.length > 0) ||
          (viewTrip.invitation_documents &&
            viewTrip.invitation_documents.length > 0)) && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">
              Airport Service Documents
            </h3>

            {/* Passport Documents */}
            {viewTrip.passport_documents &&
              viewTrip.passport_documents.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Passport Pictures
                  </h4>
                  <div className="space-y-2">
                    {viewTrip.passport_documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {doc.passenger_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {doc.name}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Invitation Documents */}
            {viewTrip.invitation_documents &&
              viewTrip.invitation_documents.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Invitation Letters
                  </h4>
                  <div className="space-y-2">
                    {viewTrip.invitation_documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {doc.passenger_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {doc.name}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
    </div>
  );
}
