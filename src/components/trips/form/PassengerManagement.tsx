
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { PassengerManagementProps } from "./types";

export function PassengerManagement({
  passengers,
  newPassenger,
  setNewPassenger,
  addPassenger,
  updatePassenger,
  removePassenger,
  handleKeyDown
}: PassengerManagementProps) {
  return (
    <div className="border p-4 rounded-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Passengers</h3>
      </div>
      
      {/* New passenger input with add button */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add new passenger"
          value={newPassenger}
          onChange={(e) => setNewPassenger(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button 
          type="button" 
          variant="default" 
          size="sm" 
          onClick={addPassenger}
          disabled={!newPassenger.trim()}
          className="h-10"
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      
      {/* List of existing passengers */}
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {passengers.filter(p => p.trim()).map((passenger, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm flex justify-between items-center">
              <span>{passenger}</span>
              <button 
                type="button" 
                onClick={() => removePassenger(index)}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {passengers.filter(p => p.trim()).length === 0 && (
          <div className="text-sm text-muted-foreground italic p-2 text-center">
            No passengers added yet
          </div>
        )}
      </div>
    </div>
  );
}
