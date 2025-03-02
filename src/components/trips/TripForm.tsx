import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripStatus, TripType, DisplayTrip } from "@/lib/types/trip";
import { parseFlightDetails, parsePassengers } from "@/components/trips/utils";
import { Client, Driver, Vehicle } from "@/lib/types";
import { Plus, X } from "lucide-react";

type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

interface TripFormProps {
  editTrip: DisplayTrip | null;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function TripForm({
  editTrip,
  clients,
  vehicles,
  drivers,
  onClose,
  onSubmit
}: TripFormProps) {
  const [serviceType, setServiceType] = useState<UIServiceType>("airport_pickup");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);

  useEffect(() => {
    if (editTrip) {
      setServiceType(editTrip.ui_service_type as UIServiceType || formatUIServiceType(editTrip));
      setSelectedClientId(editTrip.client_id);
      
      if (editTrip.client_type === "organization") {
        setSelectedClientType("organization");
        const extractedPassengers = parsePassengers(editTrip.notes);
        setPassengers(extractedPassengers.length > 0 ? extractedPassengers : [""]);
      } else {
        setSelectedClientType("individual");
        setPassengers([""]);
      }
    } else {
      setServiceType("airport_pickup");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
    }
  }, [editTrip]);

  const formatUIServiceType = (trip: DisplayTrip): UIServiceType => {
    if (trip.type === "airport_pickup") return "airport_pickup";
    if (trip.type === "airport_dropoff") return "airport_dropoff";
    if (trip.type === "full_day") return "full_day_hire";
    
    if (trip.type === "other") {
      if (trip.pickup_location?.toLowerCase().includes("airport") || 
          trip.dropoff_location?.toLowerCase().includes("airport")) {
        return "round_trip";
      }
      
      if (trip.notes?.toLowerCase().includes("security") || 
          trip.notes?.toLowerCase().includes("escort")) {
        return "security_escort";
      }
      
      if (trip.start_time && trip.end_time) {
        return "round_trip";
      }
      
      return "one_way";
    }
    
    return "one_way";
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    
    if (!clientId) {
      setSelectedClientType("");
      setPassengers([""]);
      return;
    }
    
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient) {
      setSelectedClientType(selectedClient.type || "individual");
      setPassengers([""]);
    }
  };

  const addPassengerField = () => {
    setPassengers([...passengers, ""]);
  };

  const updatePassenger = (index: number, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = value;
    setPassengers(updatedPassengers);
  };

  const removePassengerField = (index: number) => {
    if (passengers.length <= 1) return;
    const updatedPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(updatedPassengers);
  };

  return (
    <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
      <form onSubmit={onSubmit} className="space-y-6">
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

        {selectedClientType === "organization" && (
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
        )}

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
                  defaultValue={editTrip?.flight_number || ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airline">Airline</Label>
                <Input 
                  id="airline"
                  name="airline"
                  placeholder="e.g. British Airways"
                  defaultValue={editTrip?.airline || ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terminal">Terminal</Label>
                <Input 
                  id="terminal"
                  name="terminal"
                  placeholder="e.g. Terminal 5"
                  defaultValue={editTrip?.terminal || ""}
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
            defaultValue={editTrip?.notes || ""}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editTrip ? "Save Changes" : "Book Trip"}
          </Button>
        </DialogFooter>
      </form>
    </ScrollArea>
  );
}
