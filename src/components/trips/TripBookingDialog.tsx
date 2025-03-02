
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { DisplayTrip, TripType } from "@/lib/types/trip";
import { Client } from "@/components/clients/hooks/use-clients-query";
import { Driver } from "@/lib/types/driver";
import { Vehicle } from "@/lib/types/vehicle";

// Define custom service types for UI display
type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

interface TripBookingDialogProps {
  bookingOpen: boolean;
  editTrip: DisplayTrip | null;
  setBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditTrip: React.Dispatch<React.SetStateAction<DisplayTrip | null>>;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  handleSaveTrip: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  parsePassengers: (notes?: string) => string[];
  parseFlightDetails: (notes?: string) => { flight: string | null; airline: string | null; terminal: string | null; };
}

const TripBookingDialog: React.FC<TripBookingDialogProps> = ({
  bookingOpen,
  editTrip,
  setBookingOpen,
  setEditTrip,
  clients,
  vehicles,
  drivers,
  handleSaveTrip,
  parsePassengers,
  parseFlightDetails,
}) => {
  const [serviceType, setServiceType] = useState<UIServiceType>("airport_pickup");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);

  // When editing a trip, initialize form values
  useEffect(() => {
    if (editTrip) {
      setServiceType(editTrip.ui_service_type as UIServiceType || "airport_pickup");
      setSelectedClientId(editTrip.client_id);
      
      if (editTrip.client_type === "organization") {
        setSelectedClientType("organization");
        // Extract passengers from notes
        const extractedPassengers = parsePassengers(editTrip.notes);
        setPassengers(extractedPassengers.length > 0 ? extractedPassengers : [""]);
      } else {
        setSelectedClientType("individual");
        setPassengers([""]);
      }
    } else {
      // Reset form values when not editing
      setServiceType("airport_pickup");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
    }
  }, [editTrip, parsePassengers]);

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

  return (
    <Dialog open={bookingOpen || editTrip !== null} onOpenChange={(open) => {
      if (!open) {
        setBookingOpen(false);
        setEditTrip(null);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
          <DialogDescription>
            {editTrip
              ? "Update the details for this trip."
              : "Enter the details to book a new trip."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSaveTrip}>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select
                  name="service_type"
                  value={serviceType}
                  onValueChange={(value) => setServiceType(value as UIServiceType)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                    <SelectItem value="security_escort">Security Escort</SelectItem>
                    <SelectItem value="one_way">One Way Transfer</SelectItem>
                    <SelectItem value="full_day_hire">Full Day Hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  name="client_id" 
                  value={selectedClientId} 
                  onValueChange={handleClientChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.type === "organization" ? "(Organization)" : "(Individual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClientType === "organization" && (
                <div className="space-y-2">
                  <Label>Passengers</Label>
                  <div className="space-y-2">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={passenger}
                          onChange={(e) => updatePassenger(index, e.target.value)}
                          placeholder={`Passenger ${index + 1} name`}
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePassengerField(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPassengerField}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Passenger
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver</Label>
                <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle</Label>
                <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
                  <SelectTrigger>
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
              
              {!editTrip && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is_recurring" 
                      name="is_recurring" 
                      checked={isRecurring}
                      onCheckedChange={(checked) => 
                        setIsRecurring(checked === true)
                      }
                    />
                    <Label htmlFor="is_recurring" className="cursor-pointer">Recurring Trip</Label>
                  </div>
                  
                  {isRecurring && (
                    <div className="pl-6 pt-2 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select 
                          name="frequency" 
                          value={frequency}
                          onValueChange={(value) => 
                            setFrequency(value as "daily" | "weekly" | "monthly")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="occurrences">Number of Occurrences</Label>
                        <Input 
                          type="number" 
                          name="occurrences" 
                          min="1" 
                          max="52" 
                          defaultValue="4" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  type="date" 
                  name="date" 
                  defaultValue={editTrip?.date || new Date().toISOString().split("T")[0]} 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input 
                    type="time" 
                    name="time" 
                    defaultValue={editTrip?.start_time || "09:00"} 
                    required
                  />
                </div>
                
                {(serviceType === "round_trip" || serviceType === "security_escort" || serviceType === "full_day_hire") && (
                  <div className="space-y-2">
                    <Label htmlFor="return_time">End Time</Label>
                    <Input 
                      type="time" 
                      name="return_time" 
                      defaultValue={editTrip?.end_time || "17:00"} 
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location</Label>
                <Input 
                  name="pickup_location" 
                  defaultValue={editTrip?.pickup_location || ""} 
                  placeholder="Enter pickup address" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Dropoff Location</Label>
                <Input 
                  name="dropoff_location" 
                  defaultValue={editTrip?.dropoff_location || ""} 
                  placeholder="Enter dropoff address" 
                  required
                />
              </div>
              
              {(serviceType === "airport_pickup" || serviceType === "airport_dropoff") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight_number">Flight Number</Label>
                    <Input 
                      name="flight_number" 
                      defaultValue={editTrip?.flight_number || parseFlightDetails(editTrip?.notes).flight || ""} 
                      placeholder="e.g. BA123" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="airline">Airline</Label>
                      <Input 
                        name="airline" 
                        defaultValue={editTrip?.airline || parseFlightDetails(editTrip?.notes).airline || ""} 
                        placeholder="e.g. British Airways" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="terminal">Terminal</Label>
                      <Input 
                        name="terminal" 
                        defaultValue={editTrip?.terminal || parseFlightDetails(editTrip?.notes).terminal || ""} 
                        placeholder="e.g. Terminal 5" 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="special_notes">Special Instructions</Label>
                <Textarea 
                  name="special_notes" 
                  rows={3}
                  defaultValue={editTrip?.notes || ""} 
                  placeholder="Enter any special instructions or requirements" 
                />
              </div>
              
              {editTrip && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editTrip.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trip status" />
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
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="secondary" onClick={() => {
              setBookingOpen(false);
              setEditTrip(null);
            }}>
              Cancel
            </Button>
            <Button type="submit">
              {editTrip ? "Update Trip" : "Book Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripBookingDialog;
