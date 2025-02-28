import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripStatus, TripType, DisplayTrip, Client, Driver, Vehicle } from "@/lib/types";
import { PassengersList } from "./PassengersList";
import { parseFlightDetails, formatUIServiceType } from "./trip-utils";

// Define custom service types for UI display
export type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

// Map UI service types to database TripType values
export const serviceTypeMap: Record<UIServiceType, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "other",
  "security_escort": "other",
  "one_way": "other",
  "full_day_hire": "full_day"
};

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTrip: DisplayTrip | null;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  onSaveTrip: (formData: FormData) => Promise<void>;
}

export function TripFormDialog({
  open,
  onOpenChange,
  editTrip,
  clients,
  vehicles,
  drivers,
  onSaveTrip
}: TripFormDialogProps) {
  const [serviceType, setServiceType] = useState<UIServiceType>("airport_pickup");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);

  // When editing a trip, set the initial state values
  useEffect(() => {
    if (editTrip) {
      // Extract UI service type from the trip
      const uiType = editTrip.ui_service_type as UIServiceType || formatUIServiceType(editTrip);
      setServiceType(uiType);
      
      // Set selected client
      if (editTrip.client_id) {
        setSelectedClientId(editTrip.client_id);
        
        // Get client type
        const clientDetails = clients?.find(c => c.id === editTrip.client_id);
        if (clientDetails) {
          setSelectedClientType(clientDetails.type || "individual");
        }
      }
      
      // Extract passengers from notes if present
      if (editTrip.notes) {
        const passengersMatch = editTrip.notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
        if (passengersMatch && passengersMatch[1]) {
          const passengerNames = passengersMatch[1].split('\n').filter(p => p.trim());
          if (passengerNames.length > 0) {
            setPassengers(passengerNames);
            return;
          }
        }
      }
      
      // Default to single empty passenger for organization clients
      if (editTrip.client_type === "organization") {
        setPassengers([""]);
      }
    } else {
      // Reset form when creating a new trip
      setServiceType("airport_pickup");
      setIsRecurring(false);
      setFrequency("weekly");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
    }
  }, [editTrip, clients]);

  // Handle client selection to show passenger fields if organization
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    
    if (!clientId) {
      setSelectedClientType("");
      setPassengers([""]);
      return;
    }
    
    // Find the selected client and check its type
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient) {
      setSelectedClientType(selectedClient.type || "individual");
      // Reset passengers when client changes
      setPassengers([""]);
    }
  };

  // Add new passenger field
  const addPassengerField = () => {
    setPassengers([...passengers, ""]);
  };

  // Update passenger at specific index
  const updatePassenger = (index: number, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = value;
    setPassengers(updatedPassengers);
  };

  // Remove passenger field
  const removePassengerField = (index: number) => {
    if (passengers.length <= 1) return; // Keep at least one field
    const updatedPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(updatedPassengers);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveTrip(new FormData(event.currentTarget));
  };

  // Reset form when closing dialog
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only reset if not in edit mode, otherwise the form should keep its state
      if (!editTrip) {
        setServiceType("airport_pickup");
        setIsRecurring(false);
        setFrequency("weekly");
        setSelectedClientId("");
        setSelectedClientType("");
        setPassengers([""]);
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
          <DialogDescription>
            {editTrip 
              ? `Edit trip details for ${editTrip.client_name}`
              : "Create a new trip reservation"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  name="client_id" 
                  defaultValue={editTrip?.client_id} 
                  onValueChange={handleClientChange}
                  required
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.type === "organization" && "🏢"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select 
                  name="service_type" 
                  value={serviceType}
                  onValueChange={(value: string) => setServiceType(value as UIServiceType)}
                  required
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="one_way">One Way Transfer</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                    <SelectItem value="full_day_hire">Full Day Hire</SelectItem>
                    <SelectItem value="security_escort">Security Escort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Passengers Section - Only show for organization clients */}
            {selectedClientType === "organization" && (
              <PassengersList 
                passengers={passengers}
                updatePassenger={updatePassenger}
                addPassengerField={addPassengerField}
                removePassengerField={removePassengerField}
              />
            )}

            {/* Flight Details Section - Only show for airport trips */}
            {(serviceType === "airport_pickup" || serviceType === "airport_dropoff") && (
              <div className="border p-4 rounded-md space-y-4">
                <h3 className="text-sm font-medium">Flight Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight_number">Flight Number</Label>
                    <Input 
                      id="flight_number"
                      name="flight_number"
                      placeholder="e.g. BA123"
                      defaultValue={parseFlightDetails(editTrip?.notes).flight || ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="airline">Airline</Label>
                    <Input 
                      id="airline"
                      name="airline"
                      placeholder="e.g. British Airways"
                      defaultValue={parseFlightDetails(editTrip?.notes).airline || ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="terminal">Terminal</Label>
                    <Input 
                      id="terminal"
                      name="terminal"
                      placeholder="e.g. Terminal 5"
                      defaultValue={parseFlightDetails(editTrip?.notes).terminal || ""}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={editTrip?.date}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time"
                  name="time"
                  type="time"
                  defaultValue={editTrip?.time || editTrip?.start_time}
                  required
                />
              </div>
            </div>

            {/* Show return time for round trips, security escorts, and full day hires */}
            {["round_trip", "security_escort", "full_day_hire"].includes(serviceType) && (
              <div className="space-y-2">
                <Label htmlFor="return_time">Return Time</Label>
                <Input 
                  id="return_time"
                  name="return_time"
                  type="time"
                  defaultValue={editTrip?.return_time || editTrip?.end_time}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle</Label>
                <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
                  <SelectTrigger id="vehicle_id">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver</Label>
                <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
                  <SelectTrigger id="driver_id">
                    <SelectValue placeholder="Select driver" />
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
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location</Label>
                <Input 
                  id="pickup_location"
                  name="pickup_location"
                  placeholder="Enter pickup location"
                  defaultValue={editTrip?.pickup_location || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Dropoff Location</Label>
                <Input 
                  id="dropoff_location"
                  name="dropoff_location"
                  placeholder="Enter dropoff location"
                  defaultValue={editTrip?.dropoff_location || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_notes">Notes</Label>
              <Textarea 
                id="special_notes"
                name="special_notes"
                placeholder="Add any special instructions or notes"
                defaultValue={editTrip?.special_notes || editTrip?.notes?.replace(/Flight: .*\n?/g, '')
                                        .replace(/Airline: .*\n?/g, '')
                                        .replace(/Terminal: .*\n?/g, '')
                                        .replace(/\n\nPassengers:\n.*$/s, '') // Remove existing passengers list
                                        .trim() || ""}
                className="min-h-[80px]"
              />
            </div>

            {editTrip && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editTrip.status} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!editTrip && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_recurring" 
                  name="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">This is a recurring trip</Label>
              </div>
            )}

            {!editTrip && isRecurring && (
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="occurrences">Number of Occurrences</Label>
                  <Input 
                    id="occurrences"
                    name="occurrences"
                    type="number"
                    defaultValue="4"
                    min="2"
                    required={isRecurring}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    name="frequency" 
                    value={frequency}
                    onValueChange={(value) => setFrequency(value as "daily" | "weekly" | "monthly")}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editTrip ? "Save Changes" : "Book Trip"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
