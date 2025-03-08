
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Driver, Vehicle } from "@/lib/types";
import { UIServiceType } from "./types";
import { DisplayTrip } from "@/lib/types/trip";

interface SelectsProps {
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  editTrip: DisplayTrip | null;
  selectedClientId: string;
  serviceType: UIServiceType;
  handleClientChange: (clientId: string) => void;
  setServiceType: (value: UIServiceType) => void;
  selectedDate?: string;
  selectedTime?: string;
  allTrips?: DisplayTrip[];
}

export function ClientVehicleDriverSelects({
  clients,
  vehicles,
  drivers,
  editTrip,
  selectedClientId,
  serviceType,
  handleClientChange,
  setServiceType,
  selectedDate,
  selectedTime,
  allTrips = []
}: SelectsProps) {
  return (
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
  );
}

export function VehicleDriverSelects({
  vehicles,
  drivers,
  editTrip,
  selectedDate,
  selectedTime,
  allTrips = []
}: {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  editTrip: DisplayTrip | null;
  selectedDate?: string;
  selectedTime?: string;
  allTrips?: DisplayTrip[];
}) {
  // Filter out unavailable drivers and vehicles for the selected time slot
  const filteredDrivers = drivers?.filter(driver => {
    // When editing, allow the trip's current driver to be selected
    if (editTrip && editTrip.driver_id === driver.id) {
      return true;
    }
    
    if (!selectedDate || !selectedTime || !allTrips) return true;

    // Check if driver is assigned to another trip at the same time
    return !allTrips.some(trip => {
      if (trip.id === editTrip?.id) return false; // Exclude current trip
      
      // Check if driver is assigned to this trip
      if (trip.driver_id !== driver.id) return false;
      
      // For simplicity, we're checking if the trip is on the same date
      // and within 1 hour of the selected time (you could make this more sophisticated)
      if (trip.date !== selectedDate) return false;
      
      // Converting time strings (HH:MM) to minutes for easier comparison
      const selectedMinutes = convertTimeToMinutes(selectedTime);
      const tripMinutes = convertTimeToMinutes(trip.time);
      
      // Consider a 1-hour buffer for scheduling
      return Math.abs(selectedMinutes - tripMinutes) < 60;
    });
  });

  const filteredVehicles = vehicles?.filter(vehicle => {
    // When editing, allow the trip's current vehicle to be selected
    if (editTrip && editTrip.vehicle_id === vehicle.id) {
      return true;
    }
    
    if (!selectedDate || !selectedTime || !allTrips) return true;

    // Check if vehicle is assigned to another trip at the same time
    return !allTrips.some(trip => {
      if (trip.id === editTrip?.id) return false; // Exclude current trip
      
      // Check if vehicle is assigned to this trip
      if (trip.vehicle_id !== vehicle.id) return false;
      
      // For simplicity, we're checking if the trip is on the same date
      // and within 1 hour of the selected time
      if (trip.date !== selectedDate) return false;
      
      // Converting time strings to minutes for easier comparison
      const selectedMinutes = convertTimeToMinutes(selectedTime);
      const tripMinutes = convertTimeToMinutes(trip.time);
      
      // Consider a 1-hour buffer for scheduling
      return Math.abs(selectedMinutes - tripMinutes) < 60;
    });
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
          <SelectTrigger id="vehicle_id">
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {filteredVehicles?.length === 0 ? (
              <SelectItem value="no_available" disabled>
                No vehicles available at this time
              </SelectItem>
            ) : (
              filteredVehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.registration})
                </SelectItem>
              ))
            )}
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
            {filteredDrivers?.length === 0 ? (
              <SelectItem value="no_available" disabled>
                No drivers available at this time
              </SelectItem>
            ) : (
              filteredDrivers?.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Helper function to convert time string (HH:MM) to minutes for easier comparison
function convertTimeToMinutes(timeString: string): number {
  if (!timeString) return 0;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
