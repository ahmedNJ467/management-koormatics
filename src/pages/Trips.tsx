import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { Trip, DisplayTrip, TripType, TripStatus } from "@/lib/types/trip";
import { useToast } from "@/hooks/use-toast";

const Trips = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles(make, model),
          drivers(name, avatar_url, contact),
          clients(name, type)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order('make');

      if (error) throw error;
      return data;
    },
  });

  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (date?.from && date?.to) {
      refetchTrips();
    }
  }, [date]);

  const refetchTrips = async () => {
    await queryClient.refetchQueries(['trips']);
  };

  const formatTripsData = (tripsData: any[]): DisplayTrip[] => {
    return tripsData.map(trip => {
      const client = clientsData?.find(c => c.id === trip.client_id) || { name: 'Unknown Client', type: 'organization' };
      
      const vehicle = vehiclesData?.find(v => v.id === trip.vehicle_id);
      const vehicleDetails = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle not assigned';
      
      const driver = driversData?.find(d => d.id === trip.driver_id);
      
      return {
        ...trip,
        id: trip.id,
        client_id: trip.client_id,
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        date: trip.date,
        time: trip.time || '',
        return_time: trip.return_time || '',
        start_time: trip.start_time || trip.time || '',
        end_time: trip.end_time || trip.return_time || '',
        type: trip.service_type as TripType || 'other',
        status: trip.status as TripStatus || 'scheduled',
        amount: trip.amount,
        pickup_location: trip.pickup_location || '',
        dropoff_location: trip.dropoff_location || '',
        notes: trip.special_instructions || trip.notes || '',
        invoice_id: trip.invoice_id,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        client_name: client.name,
        client_type: client.type,
        vehicle_details: vehicleDetails,
        driver_name: driver?.name || 'Driver not assigned',
        driver_avatar: driver?.avatar_url,
        driver_contact: driver?.contact,
        flight_number: trip.flight_number,
        airline: trip.airline,
        terminal: trip.terminal,
        special_notes: trip.special_instructions,
        is_recurring: trip.is_recurring,
      };
    });
  };

  const trips = tripsData ? formatTripsData(tripsData) : [];

  const addTripMutation = useMutation(
    async (newTrip: any) => {
      const { data, error } = await supabase
        .from("trips")
        .insert([newTrip]);
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trips"]);
        toast({
          title: "Trip added",
          description: "New trip has been added successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: `Failed to add trip: ${error.message}`,
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    }
  );

  const updateTripMutation = useMutation(
    async (updatedTrip: Trip) => {
      const { data, error } = await supabase
        .from("trips")
        .update(updatedTrip)
        .eq("id", updatedTrip.id);
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trips"]);
        toast({
          title: "Trip updated",
          description: "Trip has been updated successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: `Failed to update trip: ${error.message}`,
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
        setEditTripId(null);
      },
    }
  );

  const deleteTripMutation = useMutation(
    async (id: string) => {
      const { data, error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trips"]);
        toast({
          title: "Trip deleted",
          description: "Trip has been deleted successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: `Failed to delete trip: ${error.message}`,
          variant: "destructive",
        });
      },
    }
  );

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      const tripData = {
        client_id: values.client_id,
        vehicle_id: values.vehicle_id,
        driver_id: values.driver_id,
        date: values.date,
        time: values.time,
        return_time: values.return_time,
        start_time: values.time,
        end_time: values.return_time,
        service_type: values.service_type || 'other',
        type: values.service_type || 'other',
        status: values.status || 'scheduled',
        amount: Number(values.amount),
        pickup_location: values.pickup_location,
        dropoff_location: values.dropoff_location,
        notes: values.notes,
        flight_number: values.flight_number,
        airline: values.airline,
        terminal: values.terminal,
        special_instructions: values.notes,
        is_recurring: values.is_recurring || false,
      };
      
      if (editTripId) {
        await updateTripMutation.mutateAsync({ id: editTripId, ...tripData });
      } else {
        await addTripMutation.mutateAsync(tripData);
      }
    } catch (error) {
      console.error("handleSubmit error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTripMutation.mutateAsync(id);
    } catch (error) {
      console.error("handleDelete error", error);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trips</h1>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Trip</CardTitle>
          <CardDescription>Fill in the details to create a new trip</CardDescription>
        </CardHeader>
        <CardContent>
          <TripForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            vehicles={vehiclesData || []}
            drivers={driversData || []}
            clients={clientsData || []}
            editTrip={editTripId ? trips.find((trip) => trip.id === editTripId) : null}
            onCancelEdit={() => setEditTripId(null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Trips</CardTitle>
          <CardDescription>Overview of all trips</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Pick-up</TableHead>
                  <TableHead>Drop-off</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTrips || isLoadingVehicles || isLoadingDrivers || isLoadingClients ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : trips.length > 0 ? (
                  trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{format(new Date(trip.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{trip.client_name}</TableCell>
                      <TableCell>{trip.vehicle_details}</TableCell>
                      <TableCell>{trip.driver_name}</TableCell>
                      <TableCell>{trip.pickup_location}</TableCell>
                      <TableCell>{trip.dropoff_location}</TableCell>
                      <TableCell>${trip.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => setEditTripId(trip.id)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(trip.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No trips available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

interface TripFormProps {
  onSubmit: (values: any) => Promise<void>;
  isSubmitting: boolean;
  vehicles: any[];
  drivers: any[];
  clients: any[];
  editTrip: DisplayTrip | null;
  onCancelEdit: () => void;
}

const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  isSubmitting,
  vehicles,
  drivers,
  clients,
  editTrip,
  onCancelEdit,
}) => {
  const [values, setValues] = useState({
    client_id: editTrip?.client_id || "",
    vehicle_id: editTrip?.vehicle_id || "",
    driver_id: editTrip?.driver_id || "",
    date: editTrip?.date || "",
    time: editTrip?.time || "",
    return_time: editTrip?.return_time || "",
    service_type: editTrip?.type || "other",
    status: editTrip?.status || "scheduled",
    amount: editTrip?.amount?.toString() || "",
    pickup_location: editTrip?.pickup_location || "",
    dropoff_location: editTrip?.dropoff_location || "",
    notes: editTrip?.notes || "",
    flight_number: editTrip?.flight_number || "",
    airline: editTrip?.airline || "",
    terminal: editTrip?.terminal || "",
    is_recurring: editTrip?.is_recurring || false,
  });

  useEffect(() => {
    if (editTrip) {
      setValues({
        client_id: editTrip.client_id || "",
        vehicle_id: editTrip.vehicle_id || "",
        driver_id: editTrip.driver_id || "",
        date: editTrip.date || "",
        time: editTrip.time || "",
        return_time: editTrip.return_time || "",
        service_type: editTrip.type || "other",
        status: editTrip.status || "scheduled",
        amount: editTrip.amount?.toString() || "",
        pickup_location: editTrip.pickup_location || "",
        dropoff_location: editTrip.dropoff_location || "",
        notes: editTrip.notes || "",
        flight_number: editTrip.flight_number || "",
        airline: editTrip.airline || "",
        terminal: editTrip.terminal || "",
        is_recurring: editTrip.is_recurring || false,
      });
    }
  }, [editTrip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prevValues => ({ ...prevValues, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setValues(prevValues => ({ ...prevValues, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setValues(prevValues => ({ ...prevValues, date: formattedDate }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="client_id">Client</Label>
        <Select onValueChange={(value) => handleSelectChange("client_id", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <Select onValueChange={(value) => handleSelectChange("vehicle_id", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="driver_id">Driver</Label>
        <Select onValueChange={(value) => handleSelectChange("driver_id", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !values.date && "text-muted-foreground"
              )}
            >
              {values.date ? (
                format(new Date(values.date), "MMM dd, yyyy")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              selected={values.date ? new Date(values.date) : undefined}
              onSelect={handleDateChange}
              disabled={(date) =>
                date > new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="time">Time</Label>
        <Input
          type="time"
          id="time"
          name="time"
          value={values.time}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="return_time">Return Time</Label>
        <Input
          type="time"
          id="return_time"
          name="return_time"
          value={values.return_time}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="service_type">Service Type</Label>
        <Select onValueChange={(value) => handleSelectChange("service_type", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
            <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="full_day">Full Day</SelectItem>
            <SelectItem value="multi_day">Multi Day</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select onValueChange={(value) => handleSelectChange("status", value)}>
          <SelectTrigger className="w-full">
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
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          type="number"
          id="amount"
          name="amount"
          value={values.amount}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          type="text"
          id="pickup_location"
          name="pickup_location"
          value={values.pickup_location}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input
          type="text"
          id="dropoff_location"
          name="dropoff_location"
          value={values.dropoff_location}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          type="text"
          id="notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="flight_number">Flight Number</Label>
        <Input
          type="text"
          id="flight_number"
          name="flight_number"
          value={values.flight_number}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="airline">Airline</Label>
        <Input
          type="text"
          id="airline"
          name="airline"
          value={values.airline}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="terminal">Terminal</Label>
        <Input
          type="text"
          id="terminal"
          name="terminal"
          value={values.terminal}
          onChange={handleChange}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
      {editTrip && (
        <Button type="button" variant="ghost" onClick={onCancelEdit}>
          Cancel Edit
        </Button>
      )}
    </form>
  );
};

export default Trips;
