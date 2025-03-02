
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisplayTrip } from "@/lib/types/trip";
import { TripStatusSelect } from "@/components/trips/TripStatusSelect";
import { FlightDetailsFields } from "@/components/trips/FlightDetailsFields";
import { RecurringTripFields } from "@/components/trips/RecurringTripFields";
import { serviceTypeMap } from "@/components/trips/trip-operations";

const reverseServiceTypeMap: Record<string, string> = {};
Object.entries(serviceTypeMap).forEach(([key, value]) => {
  reverseServiceTypeMap[value] = key;
});

// Get service type options from the map
const serviceTypeOptions = Object.keys(serviceTypeMap);

interface TripFormProps {
  clients: any[];
  vehicles: any[];
  drivers: any[];
  editTrip: DisplayTrip | null;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function TripForm({ clients, vehicles, drivers, editTrip, handleSubmit }: TripFormProps) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<"organization" | "individual" | undefined>(undefined);
  const [serviceType, setServiceType] = useState("airport_pickup");
  
  const methods = useForm();
  const { register, watch, setValue, reset } = methods;
  
  const isRecurring = watch("is_recurring");
  const watchServiceType = watch("service_type");
  const watchClientId = watch("client_id");
  
  // Function to get client type
  const getClientType = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.type;
  };
  
  // Initialize service type based on trip type if editing
  useEffect(() => {
    if (editTrip) {
      // Find the UI service type from the DB service type
      const uiServiceType = reverseServiceTypeMap[editTrip.type] || editTrip.type;
      setValue("service_type", uiServiceType);
      setServiceType(uiServiceType);
      
      // Set all other form fields
      setValue("client_id", editTrip.client_id);
      setValue("vehicle_id", editTrip.vehicle_id);
      setValue("driver_id", editTrip.driver_id);
      setValue("date", editTrip.date);
      setValue("time", editTrip.time);
      setValue("return_time", editTrip.return_time || "");
      setValue("pickup_location", editTrip.pickup_location || "");
      setValue("dropoff_location", editTrip.dropoff_location || "");
      setValue("special_notes", editTrip.notes || "");
      setValue("is_recurring", editTrip.is_recurring || false);
      setValue("status", editTrip.status);
      
      // Set flight details if available
      if (editTrip.flight_number) setValue("flight_number", editTrip.flight_number);
      if (editTrip.airline) setValue("airline", editTrip.airline);
      if (editTrip.terminal) setValue("terminal", editTrip.terminal);
      
      // Set passenger data if available for organization clients
      if (editTrip.passengers && editTrip.passengers.length > 0) {
        setValue("passengers", editTrip.passengers.join('\n'));
      }
      
      // Set selected client and type
      setSelectedClient(editTrip.client_id);
      setSelectedClientType(getClientType(editTrip.client_id) as "organization" | "individual" | undefined);
    }
  }, [editTrip, setValue]);
  
  // Update client type when client changes
  useEffect(() => {
    if (watchClientId) {
      const clientType = getClientType(watchClientId);
      setSelectedClient(watchClientId);
      setSelectedClientType(clientType as "organization" | "individual" | undefined);
    }
  }, [watchClientId, clients]);
  
  // Update service type when it changes
  useEffect(() => {
    if (watchServiceType) {
      setServiceType(watchServiceType);
    }
  }, [watchServiceType]);
  
  const isAirportService = serviceType === "airport_pickup" || serviceType === "airport_dropoff";
  const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(serviceType);
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client, Vehicle, Driver Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client</Label>
            <Select
              defaultValue={editTrip?.client_id}
              onValueChange={(value) => setValue("client_id", value)}
            >
              <SelectTrigger id="client_id">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.type && `(${client.type})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehicle</Label>
            <Select
              defaultValue={editTrip?.vehicle_id}
              onValueChange={(value) => setValue("vehicle_id", value)}
            >
              <SelectTrigger id="vehicle_id">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.registration})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="driver_id">Driver</Label>
            <Select
              defaultValue={editTrip?.driver_id}
              onValueChange={(value) => setValue("driver_id", value)}
            >
              <SelectTrigger id="driver_id">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator />
        
        {/* Trip Details */}
        <div className="space-y-4">
          <h3 className="font-medium">Trip Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                defaultValue={editTrip?.type ? (reverseServiceTypeMap[editTrip.type] || editTrip.type) : "airport_pickup"}
                onValueChange={(value) => setValue("service_type", value)}
              >
                <SelectTrigger id="service_type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                defaultValue={editTrip?.date || new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                {...register("time")}
                defaultValue={editTrip?.time || ""}
              />
            </div>
            
            {needsReturnTime && (
              <div className="space-y-2">
                <Label htmlFor="return_time">Return Time</Label>
                <Input
                  id="return_time"
                  type="time"
                  {...register("return_time")}
                  defaultValue={editTrip?.return_time || ""}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input
                id="pickup_location"
                {...register("pickup_location")}
                placeholder="Enter pickup address"
                defaultValue={editTrip?.pickup_location || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoff_location">Dropoff Location</Label>
              <Input
                id="dropoff_location"
                {...register("dropoff_location")}
                placeholder="Enter dropoff address"
                defaultValue={editTrip?.dropoff_location || ""}
              />
            </div>
          </div>
        </div>
        
        {/* Flight Details for Airport Services */}
        {isAirportService && <FlightDetailsFields />}
        
        {/* Passenger Information for Organization Clients */}
        {selectedClientType === "organization" && (
          <div className="space-y-4">
            <h3 className="font-medium">Passenger Information</h3>
            <div className="space-y-2">
              <Label htmlFor="passengers">Passengers (one per line)</Label>
              <Textarea
                id="passengers"
                {...register("passengers")}
                placeholder="Enter passenger names (one per line)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                For organization clients, add each passenger name on a new line
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="special_notes">Special Notes</Label>
            <Textarea
              id="special_notes"
              {...register("special_notes")}
              placeholder="Any special instructions or requirements"
              defaultValue={editTrip?.notes || ""}
            />
          </div>
        </div>
        
        {/* Status Selection for Editing */}
        {editTrip && (
          <TripStatusSelect 
            status={watch("status") || editTrip.status || "scheduled"} 
            onChange={(value) => setValue("status", value)} 
          />
        )}
        
        {/* Recurring Trip Options */}
        {!editTrip && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                {...register("is_recurring")}
                onCheckedChange={(checked) => {
                  setValue("is_recurring", checked);
                }}
              />
              <Label htmlFor="is_recurring" className="font-normal">
                This is a recurring trip
              </Label>
            </div>
            
            {isRecurring && <RecurringTripFields />}
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit">
            {editTrip ? "Update Trip" : "Book Trip"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
