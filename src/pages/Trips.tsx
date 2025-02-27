import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CheckCheck, ChevronsUpDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type {
  Client,
  Driver,
  Vehicle,
  Trip,
  TripStatus,
  TripType,
  TripMessage,
  TripAssignment,
} from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TripMessageData, TripAssignmentData } from "./trips/types";

// Define service types for UI
type UIServiceType =
  | "airport_pickup"
  | "airport_dropoff"
  | "hourly"
  | "full_day"
  | "multi_day"
  | "round_trip"
  | "security_escort";

// Map UI service types to database trip types
const serviceTypeMap: { [key in UIServiceType]: TripType } = {
  airport_pickup: "airport_pickup",
  airport_dropoff: "airport_dropoff",
  hourly: "hourly",
  full_day: "full_day",
  multi_day: "multi_day",
  round_trip: "other", // Assuming 'other' is appropriate
  security_escort: "other", // Assuming 'other' is appropriate
};

// Map database trip types to UI service types
const dbServiceTypeMap: { [key in TripType]: UIServiceType } = {
  airport_pickup: "airport_pickup",
  airport_dropoff: "airport_dropoff",
  hourly: "hourly",
  full_day: "full_day",
  multi_day: "multi_day",
  other: "round_trip", // Map 'other' back to 'round_trip' or 'security_escort' as needed
};

function Trips() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedTripForMessage, setSelectedTripForMessage] =
    useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [tripMessages, setTripMessages] = useState<TripMessageData[]>([]);
  const [tripAssignments, setTripAssignments] = useState<TripAssignmentData[]>(
    []
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: trips,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select(`
        *,
        clients (
          name
        ),
        vehicles (
          make,
          model
        ),
        drivers (
          name,
          avatar_url,
          contact
        )
      `);

      if (error) {
        console.error("Error fetching trips:", error);
        throw error;
      }

      // Type assertion to ensure correct typing
      return data as any[];
    },
  });

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) {
        console.error("Error fetching clients:", error);
      } else {
        setClients(data || []);
      }
    }

    async function fetchVehicles() {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (error) {
        console.error("Error fetching vehicles:", error);
      } else {
        setVehicles(data || []);
      }
    }

    async function fetchDrivers() {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) {
        console.error("Error fetching drivers:", error);
      } else {
        setDrivers(data || []);
      }
    }

    fetchClients();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const formatDate = (date: Date | undefined): string => {
    return date ? format(date, "yyyy-MM-dd") : "";
  };

  const createRecurringTrips = async (
    formData: FormData,
    occurrences: number,
    frequencyValue: "daily" | "weekly" | "monthly"
  ) => {
    const startDate = new Date(formData.get("date") as string);
    const trips = [];

    for (let i = 0; i < occurrences; i++) {
      let nextDate = new Date(startDate);

      if (frequencyValue === "daily") {
        nextDate.setDate(startDate.getDate() + i);
      } else if (frequencyValue === "weekly") {
        nextDate.setDate(startDate.getDate() + i * 7);
      } else if (frequencyValue === "monthly") {
        nextDate.setMonth(startDate.getMonth() + i);
      }

      const nextDateStr = nextDate.toISOString().slice(0, 10);

      trips.push({
        client_id: formData.get("client_id") as string,
        vehicle_id: formData.get("vehicle_id") as string,
        driver_id: formData.get("driver_id") as string,
        date: nextDateStr,
        start_time: formData.get("time") as string,
        end_time: formData.get("return_time") as string || null,
        type: serviceTypeMap[formData.get("service_type") as UIServiceType],
        status: "scheduled" as TripStatus, // Explicitly set as scheduled
        amount: 0, // Default amount
        pickup_location: formData.get("pickup_location") as string || null,
        dropoff_location: formData.get("dropoff_location") as string || null,
        notes: formData.get("special_notes") as string || null,
      });
    }

    return trips;
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const uiServiceType = formData.get("service_type") as UIServiceType;
    const dbServiceType = serviceTypeMap[uiServiceType];
    const isRecurringChecked = formData.get("is_recurring") === "on";
    
    try {
      if (editTrip) {
        // Update existing trip
        const { error } = await supabase
          .from("trips")
          .update({
            client_id: formData.get("client_id") as string,
            vehicle_id: formData.get("vehicle_id") as string,
            driver_id: formData.get("driver_id") as string,
            date: formData.get("date") as string,
            start_time: formData.get("time") as string,
            end_time: formData.get("return_time") as string || null,
            type: dbServiceType,
            status: formData.get("status") as TripStatus,
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            notes: formData.get("special_notes") as string || null,
          })
          .eq("id", editTrip.id);
        
        if (error) {
          console.error("Error updating trip:", error);
          throw error;
        }

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else if (isRecurringChecked) {
        // Create recurring trips
        const occurrences = parseInt(formData.get("occurrences") as string) || 1;
        const frequencyValue = formData.get("frequency") as "daily" | "weekly" | "monthly";
        
        const trips = await createRecurringTrips(formData, occurrences, frequencyValue);
        
        const { error } = await supabase
          .from("trips")
          .insert(trips);
        
        if (error) {
          console.error("Error creating recurring trips:", error);
          throw error;
        }

        toast({
          title: "Recurring trips created",
          description: `${trips.length} trips have been scheduled successfully`,
        });
        
        setBookingOpen(false);
      } else {
        // Create new single trip
        const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
        
        // Prepare the trip data object
        const tripData = {
          client_id: formData.get("client_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          driver_id: formData.get("driver_id") as string,
          date: formData.get("date") as string,
          start_time: formData.get("time") as string,
          end_time: needsReturnTime ? (formData.get("return_time") as string) : null,
          type: dbServiceType,
          status: "scheduled" as TripStatus, // Explicitly set as scheduled
          amount: 0, // Default amount
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: formData.get("special_notes") as string || null,
        };
        
        console.log("Creating trip with data:", tripData);
        
        const { error, data } = await supabase
          .from("trips")
          .insert(tripData)
          .select();
        
        if (error) {
          console.error("Error creating trip:", error);
          throw error;
        }

        console.log("Trip created successfully:", data);
        
        toast({
          title: "Trip created",
          description: "New trip has been booked successfully",
        });
        
        setBookingOpen(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: "Failed to save trip details",
        variant: "destructive",
      });
    }
  };

  const assignDriverToTrip = async () => {
    if (!selectedTripId || !selectedDriverId) {
      toast({
        title: "Error",
        description: "Please select a trip and a driver.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      const { data: existingAssignment, error: existingAssignmentError } =
        await supabase
          .from("trip_assignments")
          .select("*")
          .eq("trip_id", selectedTripId)
          .eq("driver_id", selectedDriverId)
          .single();

      if (existingAssignmentError && existingAssignmentError.code !== "404") {
        console.error(
          "Error checking for existing trip assignment:",
          existingAssignmentError
        );
        throw existingAssignmentError;
      }

      if (existingAssignment) {
        toast({
          title: "Error",
          description: "This driver is already assigned to this trip.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("trip_assignments").insert([
        {
          trip_id: selectedTripId,
          driver_id: selectedDriverId,
          assigned_at: new Date().toISOString(),
          status: "pending",
        },
      ]);

      if (error) {
        console.error("Error assigning driver to trip:", error);
        throw error;
      }

      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trip-assignments"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign driver to the trip.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
      setSelectedTripId(null);
      setSelectedDriverId(null);
    }
  };

  const sendMessage = async () => {
    if (!selectedTripForMessage || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Please select a trip and enter a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from("trip_messages")
        .insert([
          {
            trip_id: selectedTripForMessage,
            sender_type: "admin",
            sender_name: "Admin",
            message: messageText,
            timestamp: new Date().toISOString(),
            is_read: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      // Explicitly cast the returned data to TripMessageData to ensure type compatibility
      const newMessage = data as TripMessageData;
      setTripMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageText("");
      toast({
        title: "Message sent",
        description: "Message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trip-messages"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
      setSelectedTripForMessage(null);
    }
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
          <CardDescription>Manage your trips here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Book a Trip</h2>
            <Button onClick={() => setBookingOpen(true)}>Add Trip</Button>
          </div>

          {isLoading ? (
            <p>Loading trips...</p>
          ) : isError ? (
            <p>Error fetching trips.</p>
          ) : (
            <Table>
              <TableCaption>A list of your recent trips.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips?.map((trip: any) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">
                      {trip.date} {trip.start_time}
                    </TableCell>
                    <TableCell>{trip.clients?.name}</TableCell>
                    <TableCell>
                      {trip.vehicles?.make} {trip.vehicles?.model}
                    </TableCell>
                    <TableCell>{trip.drivers?.name}</TableCell>
                    <TableCell>
                      {trip.type}
                    </TableCell>
                    <TableCell>{trip.status}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditTrip(trip)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTripId(trip.id);
                          setIsAssigning(true);
                        }}
                      >
                        Assign Driver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTripForMessage(trip.id);
                          setIsSendingMessage(true);
                        }}
                      >
                        Send Message
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Drawer open={bookingOpen} onOpenChange={setBookingOpen}>
        <DrawerTrigger asChild>
          <Button>Add Trip</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Book a Trip</DrawerTitle>
            <DrawerDescription>
              Schedule a new trip for your clients.
            </DrawerDescription>
          </DrawerHeader>
          <div className="container py-10">
            <Card>
              <CardContent>
                <form onSubmit={handleSaveTrip}>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client_id">Client</Label>
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle_id">Vehicle</Label>
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.make} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="driver_id">Driver</Label>
                        <Select>
                          <SelectTrigger className="w-[180px]">
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

                      <div>
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[180px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              {date ? formatDate(date) : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                            side="bottom"
                          >
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              disabled={(date) =>
                                date > new Date() || date < new Date("2023-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          type="time"
                          id="time"
                          defaultValue={editTrip?.start_time || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="return_time">Return Time</Label>
                        <Input
                          type="time"
                          id="return_time"
                          defaultValue={editTrip?.end_time || ""}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service_type">Service Type</Label>
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="airport_pickup">
                            Airport Pickup
                          </SelectItem>
                          <SelectItem value="airport_dropoff">
                            Airport Dropoff
                          </SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="full_day">Full Day</SelectItem>
                          <SelectItem value="multi_day">Multi Day</SelectItem>
                          <SelectItem value="round_trip">Round Trip</SelectItem>
                          <SelectItem value="security_escort">
                            Security Escort
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="special_notes">Special Notes</Label>
                      <Textarea
                        id="special_notes"
                        placeholder="Any special instructions for the driver?"
                        defaultValue={editTrip?.notes || ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="is_recurring">Recurring Trip</Label>
                      <Switch id="is_recurring" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="occurrences">Occurrences</Label>
                        <Input
                          type="number"
                          id="occurrences"
                          placeholder="Number of occurrences"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select>
                          <SelectTrigger className="w-[180px]">
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
                  </div>
                  <DrawerFooter>
                    <Button type="submit">
                      {editTrip ? "Update Trip" : "Book Trip"}
                    </Button>
                  </DrawerFooter>
                </form>
              </CardContent>
            </Card>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={isAssigning} onOpenChange={setIsAssigning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Select a driver to assign to this trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            <Label htmlFor="driver">Driver</Label>
            <Select onValueChange={(value) => setSelectedDriverId(value)}>
              <SelectTrigger className="w-[180px]">
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
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAssigning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={assignDriverToTrip}>
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isSendingMessage}
        onOpenChange={setIsSendingMessage}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Message</AlertDialogTitle>
            <AlertDialogDescription>
              Send a message to the driver for this trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSendingMessage(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={sendMessage}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Trips;
