
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface PassengersListProps {
  passengers: string[];
  updatePassenger: (index: number, value: string) => void;
  addPassengerField: () => void;
  removePassengerField: (index: number) => void;
}

export function PassengersList({
  passengers,
  updatePassenger,
  addPassengerField,
  removePassengerField
}: PassengersListProps) {
  return (
    <div className="border p-4 rounded-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Passengers</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addPassengerField}
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Passenger
        </Button>
      </div>
      
      <div className="space-y-3">
        {passengers.map((passenger, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Passenger ${index + 1} name`}
              value={passenger}
              onChange={(e) => updatePassenger(index, e.target.value)}
              className="flex-1"
            />
            {passengers.length > 1 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removePassengerField(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
