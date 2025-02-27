
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { useToast } from "@/components/ui/use-toast"
import {
  Eye,
  Car,
  User,
  Clock,
  MapPin,
  Plane
} from "lucide-react"
import { format } from 'date-fns';

import {
  Client,
  Vehicle,
  Driver,
  Trip,
  DisplayTrip,
  TripStatus,
  TripType,
  UIServiceType
} from "@/lib/types"

function convertToTripType(uiServiceType: UIServiceType): TripType {
  switch (uiServiceType) {
    case "airport_pickup": return "airport_pickup";
    case "airport_dropoff": return "airport_dropoff";
    case "one_way": return "other";
    case "round_trip": return "other";
    case "full_day_hire": return "full_day";
    case "security_escort": return "hourly";
    default: return "other";
  }
}

function convertToUIServiceType(tripType: TripType): UIServiceType {
    switch (tripType) {
        case "airport_pickup": return "airport_pickup";
        case "airport_dropoff": return "airport_dropoff";
        case "full_day": return "full_day_hire";
        case "hourly": return "security_escort";
        default: return "one_way";
    }
}

async function getClients(): Promise<Client[]> {
  // Simulate fetching clients from a database
  return new Promise((resolve) => {
    setTimeout(() => {
      const clients: Client[] = [
        { id: "1", name: "Client A", type: "organization" },
        { id: "2", name: "Client B", type: "individual" },
      ];
      resolve(clients);
    }, 500);
  });
}

async function getVehicles(): Promise<Vehicle[]> {
  // Simulate fetching vehicles from a database
  return new Promise((resolve) => {
    setTimeout(() => {
      const vehicles: Vehicle[] = [
        { id: "101", make: "Toyota", model: "Camry", registration: "REG123", type: "soft_skin", status: "active" },
        { id: "102", make: "Mercedes", model: "S-Class", registration: "LUX789", type: "armoured", status: "active" },
      ];
      resolve(vehicles);
    }, 500);
  });
}

async function getDrivers(): Promise<Driver[]> {
  // Simulate fetching drivers from a database
  return new Promise((resolve) => {
    setTimeout(() => {
      const drivers: Driver[] = [
        { id: "201", name: "Driver X", contact: "123-456-7890", license_number: "DL123", license_type: "A", license_expiry: "2024-12-31", status: "active" },
        { id: "202", name: "Driver Y", contact: "987-654-3210", license_number: "DL456", license_type: "B", license_expiry: "2025-11-30", status: "active" },
      ];
      resolve(drivers);
    }, 500);
  });
}

async function getTrips(): Promise<DisplayTrip[]> {
  // Simulate fetching trips from a database
  return new Promise((resolve) => {
    setTimeout(() => {
      const trips: DisplayTrip[] = [
        {
          id: "301",
          client_id: "1",
          client_name: "Client A",
          vehicle_id: "101",
          vehicle_details: "Toyota Camry (REG123)",
          driver_id: "201",
          driver_name: "Driver X",
          driver_contact: "123-456-7890",
          date: "2024-07-15",
          start_time: "09:00",
          end_time: "10:00",
          type: "airport_pickup",
          status: "scheduled",
          amount: 50.00,
          pickup_location: "Airport",
          dropoff_location: "Hotel",
          notes: "Flight: BA249\nAirline: British Airways\nTerminal: 5",
          invoice_id: "INV001",
          special_notes: "Meet at arrival hall",
          time: "09:00",
          return_time: "10:00",
          flight_number: "BA249",
          airline: "British Airways",
          terminal: "5",
          is_recurring: false,
          ui_service_type: "airport_pickup"
        },
        {
          id: "302",
          client_id: "2",
          client_name: "Client B",
          vehicle_id: "102",
          vehicle_details: "Mercedes S-Class (LUX789)",
          driver_id: "202",
          driver_name: "Driver Y",
          driver_contact: "987-654-3210",
          date: "2024-07-16",
          start_time: "14:00",
          end_time: "15:00",
          type: "airport_dropoff",
          status: "in_progress",
          amount: 75.00,
          pickup_location: "Hotel",
          dropoff_location: "Airport",
          notes: "Flight: BA249\nAirline: British Airways\nTerminal: 5",
          invoice_id: "INV002",
          special_notes: "Assist with luggage",
          time: "14:00",
          return_time: "15:00",
          flight_number: "BA249",
          airline: "British Airways",
          terminal: "5",
          is_recurring: false,
          ui_service_type: "airport_dropoff"
        },
      ];
      resolve(trips);
    }, 500);
  });
}

const Trips = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<DisplayTrip[]>([]);
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [serviceType, setServiceType] = useState<UIServiceType>("airport_pickup");
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      const clientsData = await getClients();
      setClients(clientsData);

      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);

      const driversData = await getDrivers();
      setDrivers(driversData);

      const tripsData = await getTrips();
      setTrips(tripsData);
    };

    loadData();
  }, []);

  const handleViewTrip = (trip: DisplayTrip) => {
    setViewTrip(trip);
  };

  const handleEditTrip = (trip: DisplayTrip) => {
    setEditTrip(trip);
    setServiceType(trip.ui_service_type || "airport_pickup" as UIServiceType);
  };

  const handleDeleteTrip = (tripId: string) => {
    // Simulate deleting a trip
    setTrips(trips.filter((trip) => trip.id !== tripId));
    toast({
      title: "Trip deleted.",
      description: "The trip has been successfully deleted.",
    })
  };

  const handleSaveTrip = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const tripData: DisplayTrip = {
      id: editTrip?.id || Math.random().toString(36).substring(7),
      client_id: formData.get("client_id") as string,
      client_name: clients.find(c => c.id === formData.get("client_id"))?.name || "Unknown",
      vehicle_id: formData.get("vehicle_id") as string,
      vehicle_details: vehicles.find(v => v.id === formData.get("vehicle_id"))?.make + ' ' + vehicles.find(v => v.id === formData.get("vehicle_id"))?.model + ' (' + vehicles.find(v => v.id === formData.get("vehicle_id"))?.registration + ')' || "Unknown",
      driver_id: formData.get("driver_id") as string,
      driver_name: drivers.find(d => d.id === formData.get("driver_id"))?.name || "Unknown",
      date: formData.get("date") as string,
      start_time: formData.get("time") as string,
      end_time: formData.get("return_time") as string || formData.get("time") as string,
      type: convertToTripType(serviceType),
      status: (formData.get("status") as TripStatus) || "scheduled",
      amount: 100, // hardcoded
      pickup_location: formData.get("pickup_location") as string,
      dropoff_location: formData.get("dropoff_location") as string,
      notes: formData.get("special_notes") as string,
      invoice_id: "INV003", // hardcoded
      special_notes: formData.get("special_notes") as string,
      time: formData.get("time") as string,
      return_time: formData.get("return_time") as string || formData.get("time") as string,
      flight_number: formData.get("flight_number") as string,
      airline: formData.get("airline") as string,
      terminal: formData.get("terminal") as string,
      is_recurring: isRecurring,
      ui_service_type: serviceType
    };

    if (editTrip) {
      // Simulate updating an existing trip
      setTrips(trips.map(trip => trip.id === editTrip.id ? tripData : trip));
      toast({
        title: "Trip updated.",
        description: "The trip details have been successfully updated.",
      })
    } else {
      // Simulate creating a new trip
      setTrips([...trips, tripData]);
      toast({
        title: "Trip booked.",
        description: "The trip has been successfully booked.",
      })
    }

    setEditTrip(null);
    setBookingOpen(false);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid Time";
    }
  };

  // Add this function to the component, perhaps near other helper functions
  const parseFlightDetails = (notes?: string) => {
    if (!notes) return { flight: null, airline: null, terminal: null };
    
    const flightMatch = notes.match(/Flight: ([^\n]+)/);
    const airlineMatch = notes.match(/Airline: ([^\n]+)/);
    const terminalMatch = notes.match(/Terminal: ([^\n]+)/);
    
    return {
      flight: flightMatch ? flightMatch[1].trim() : null,
      airline: airlineMatch ? airlineMatch[1].trim() : null,
      terminal: terminalMatch ? terminalMatch[1].trim() : null
    };
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
          <CardDescription>Manage your trips here</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your recent trips.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Client</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.client_name}</TableCell>
                  <TableCell>{trip.vehicle_details}</TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  <TableCell>{formatDate(trip.date)}</TableCell>
                  <TableCell>{formatTime(trip.time)}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewTrip(trip)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditTrip(trip)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTrip(trip.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          {/* Wrap the Button in Dialog instead of DialogTrigger */}
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button>Book New Trip</Button>
            </DialogTrigger>
          </Dialog>
        </CardFooter>
      </Card>

      {/* View Trip Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              View detailed information about the trip
            </DialogDescription>
          </DialogHeader>
          {viewTrip && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Client</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p>{viewTrip.client_name}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Vehicle</h4>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <p>{viewTrip.vehicle_details}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Driver</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {viewTrip.driver_avatar ? (
                        <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                      ) : (
                        <AvatarFallback>{viewTrip.driver_name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p>{viewTrip.driver_name}</p>
                      {viewTrip.driver_contact && (
                        <p className="text-xs text-muted-foreground">{viewTrip.driver_contact}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Return Time</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{viewTrip.return_time ? formatTime(viewTrip.return_time) : "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Flight Details Section - Enhanced */}
              {(viewTrip.type === "airport_pickup" || viewTrip.type === "airport_dropoff") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                  {(() => {
                    // Parse flight details from notes
                    const { flight, airline, terminal } = parseFlightDetails(viewTrip.notes);
                    
                    return (
                      <>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Flight Number</h4>
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-muted-foreground" />
                            <p>{flight || "Not specified"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Airline</h4>
                          <p>{airline || "Not specified"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Terminal</h4>
                          <p>{terminal || "Not specified"}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Pickup Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{viewTrip.pickup_location || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Dropoff Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{viewTrip.dropoff_location || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {viewTrip.special_notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Special Notes</h4>
                  <p className="text-sm p-3 bg-muted rounded-md">
                    {/* Remove flight details from displayed notes */}
                    {viewTrip.special_notes.replace(/Flight: .*\n?/g, '')
                                          .replace(/Airline: .*\n?/g, '')
                                          .replace(/Terminal: .*\n?/g, '')
                                          .trim()}
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Trip Dialog - Move this outside to prevent nesting issues */}
      <Dialog open={!!editTrip || bookingOpen} onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false))}>
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
            <form onSubmit={handleSaveTrip} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select name="client_id" defaultValue={editTrip?.client_id} required>
                    <SelectTrigger id="client_id">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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

              {/* Flight Details Section */}
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
                  defaultValue={editTrip?.special_notes || editTrip?.notes || ""}
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
                <Button type="button" variant="outline" onClick={() => editTrip ? setEditTrip(null) : setBookingOpen(false)}>
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
    </div>
  );
};

export default Trips;
