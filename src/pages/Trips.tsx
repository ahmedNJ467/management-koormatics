
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
import { format } from "date-fns";
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
import { TripForm, serviceTypeMap, UIServiceType } from "@/components/trips/trip-form";
import type {
  Client,
  Driver,
  Vehicle,
  Trip,
  TripStatus,
  TripType,
  DisplayTrip,
} from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

function Trips() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedTripForMessage, setSelectedTripForMessage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [tripMessages, setTripMessages] = useState<TripMessageData[]>([]);
  const [tripAssignments, setTripAssignments] = useState<TripAssignmentData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      console.log("Trips data:", data);
      
      // Map the data to include display-friendly properties
      return data.map((trip) => ({
        ...trip,
        client_name: trip.clients?.name || "Unknown Client",
        vehicle_details: trip.vehicles ? `${trip.vehicles.make} ${trip.vehicles.model}` : "Unknown Vehicle",
        driver_name: trip.drivers?.name || "Unassigned",
        driver_avatar: trip.drivers?.avatar_url,
        driver_contact: trip.drivers?.contact,
      })) as DisplayTrip[];
    },
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase.from("clients").select("*");
        if (error) {
          console.error("Error fetching clients:", error);
          toast({
            title: "Error",
            description: "Failed to fetch clients",
            variant: "destructive",
          });
        } else {
          setClients(data || []);
        }
      } catch (err) {
        console.error("Exception fetching clients:", err);
      }
    }

    async function fetchVehicles() {
      try {
        const { data, error } = await supabase.from("vehicles").select("*");
        if (error) {
          console.error("Error fetching vehicles:", error);
          toast({
            title: "Error",
            description: "Failed to fetch vehicles",
            variant: "destructive",
          });
        } else {
          setVehicles(data || []);
        }
      } catch (err) {
        console.error("Exception fetching vehicles:", err);
      }
    }

    async function fetchDrivers() {
      try {
        const { data, error } = await supabase.from("drivers").select("*");
        if (error) {
          console.error("Error fetching drivers:", error);
          toast({
            title: "Error",
            description: "Failed to fetch drivers",
            variant: "destructive",
          });
        } else {
          setDrivers(data || []);
        }
      } catch (err) {
        console.error("Exception fetching drivers:", err);
      }
    }

    fetchClients();
    fetchVehicles();
    fetchDrivers();
  }, [toast]);

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
        status: "scheduled" as TripStatus,
        amount: 0, // Default amount
        pickup_location: formData.get("pickup_location") as string || null,
        dropoff_location: formData.get("dropoff_location") as string || null,
        notes: formData.get("special_notes") as string || null,
      });
    }

    return trips;
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (formData: FormData) => {
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }
    
    setIsSubmitting(true);
    
    try {
      // Log form data for debugging
      console.log("Form data:", Object.fromEntries(formData.entries()));
      
      // Validate critical fields
      const clientId = formData.get("client_id");
      const vehicleId = formData.get("vehicle_id");
      const driverId = formData.get("driver_id");
      const dateValue = formData.get("date");
      const timeValue = formData.get("time");
      const serviceType = formData.get("service_type");
      
      if (!clientId || !vehicleId || !driverId || !dateValue || !timeValue || !serviceType) {
        console.error("Missing required fields:", { clientId, vehicleId, driverId, dateValue, timeValue, serviceType });
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      
      const uiServiceType = serviceType as UIServiceType;
      const dbServiceType = serviceTypeMap[uiServiceType];
      const isRecurringChecked = formData.get("is_recurring") === "on";
      
      if (editTrip) {
        // Update existing trip
        console.log("Updating existing trip:", editTrip.id);
        
        const tripData = {
          client_id: clientId as string,
          vehicle_id: vehicleId as string,
          driver_id: driverId as string,
          date: dateValue as string,
          start_time: timeValue as string,
          end_time: formData.get("return_time") as string || null,
          type: dbServiceType,
          status: formData.get("status") as TripStatus || "scheduled",
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: formData.get("special_notes") as string || null,
        };
        
        console.log("Trip update data:", tripData);
        
        const { error } = await supabase
          .from("trips")
          .update(tripData)
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
        if (occurrences <= 0 || isNaN(occurrences)) {
          toast({
            title: "Invalid value",
            description: "Number of occurrences must be a positive number",
            variant: "destructive",
          });
          return;
        }
        
        const frequencyValue = formData.get("frequency") as "daily" | "weekly" | "monthly";
        if (!frequencyValue) {
          toast({
            title: "Missing Information",
            description: "Please select a frequency for recurring trips",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Creating recurring trips:", { occurrences, frequencyValue });
        
        const trips = await createRecurringTrips(formData, occurrences, frequencyValue);
        console.log("Recurring trips data:", trips);
        
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
        const tripData = {
          client_id: clientId as string,
          vehicle_id: vehicleId as string,
          driver_id: driverId as string,
          date: dateValue as string,
          start_time: timeValue as string,
          end_time: formData.get("return_time") as string || null,
          type: dbServiceType,
          status: "scheduled" as TripStatus,
          amount: 0, // Default amount
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: formData.get("special_notes") as string || null,
        };
        
        console.log("Creating new trip:", tripData);
        
        const { error } = await supabase
          .from("trips")
          .insert([tripData]);
        
        if (error) {
          console.error("Error creating trip:", error);
          throw error;
        }

        toast({
          title: "Trip created",
          description: "New trip has been scheduled successfully",
        });
        
        setBookingOpen(false);
      }
      
      // Refresh trips data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: "Failed to save trip details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignDriver = async () => {
    if (!selectedTripId || !selectedDriverId) {
      toast({
        title: "Error",
        description: "Please select both a trip and a driver.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      const { error } = await supabase.from("trip_assignments").insert([
        {
          trip_id: selectedTripId,
          driver_id: selectedDriverId,
          status: "pending",
        },
      ]);

      if (error) {
        throw error;
      }

      // Update the driver_id in the trips table
      const { error: tripUpdateError } = await supabase
        .from("trips")
        .update({ driver_id: selectedDriverId })
        .eq("id", selectedTripId);

      if (tripUpdateError) {
        throw tripUpdateError;
      }

      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip successfully.",
      });

      // Refresh trips data
      queryClient.invalidateQueries({ queryKey: ["trips"] });

      setSelectedTripId(null);
      setSelectedDriverId(null);
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
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
        throw error;
      }

      // Explicitly cast the returned data to TripMessageData
      const newMessage = data as TripMessageData;
      setTripMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageText("");
      toast({
        title: "Message sent",
        description: "Message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trip-messages"] });
    } catch (error) {
      console.error("Error sending message:", error);
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

  // Status badge component based on trip status
  const StatusBadge = ({ status }: { status: TripStatus }) => {
    const getVariant = () => {
      switch (status) {
        case "scheduled":
          return "outline";
        case "in_progress":
          return "default";
        case "completed":
          return "success";
        case "cancelled":
          return "destructive";
        default:
          return "outline";
      }
    };

    return <Badge variant={getVariant() as any}>{status.replace('_', ' ')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Trips</h1>
        <div>Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Trips</h1>
        <div className="text-red-500">Error loading trips. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips Management</h1>
        <Button onClick={() => setBookingOpen(true)}>Book New Trip</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Assignments</CardTitle>
            <CardDescription>Assign drivers to scheduled trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="trip-select">Select Trip</Label>
                <Select onValueChange={setSelectedTripId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips &&
                      trips
                        .filter((trip) => trip.status === "scheduled")
                        .map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.client_name} - {format(new Date(trip.date), "MMM d, yyyy")}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-select">Select Driver</Label>
                <Select onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers
                      .filter((driver) => driver.status === "active")
                      .map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={assignDriver} disabled={isAssigning}>
                {isAssigning ? "Assigning..." : "Assign Driver"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip Communications</CardTitle>
            <CardDescription>Send messages to drivers and clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-trip-select">Select Trip</Label>
                <Select onValueChange={setSelectedTripForMessage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips &&
                      trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.client_name} - {format(new Date(trip.date), "MMM d, yyyy")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-text">Message</Label>
                <Textarea
                  id="message-text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter your message here"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={sendMessage} disabled={isSendingMessage}>
                  {isSendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
            <CardDescription>View and manage all scheduled trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips && trips.length > 0 ? (
                    trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {format(new Date(trip.date), "MMM d, yyyy")}
                          <div className="text-xs text-muted-foreground">
                            {trip.start_time ? trip.start_time.substring(0, 5) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{trip.client_name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {trip.vehicle_details}
                        </TableCell>
                        <TableCell>{trip.driver_name}</TableCell>
                        <TableCell>
                          <StatusBadge status={trip.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditTrip(trip)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No trips found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Trip Dialog */}
      <AlertDialog open={editTrip !== null} onOpenChange={(open) => !open && setEditTrip(null)}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Update the details of the selected trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {editTrip && (
            <TripForm
              clients={clients}
              vehicles={vehicles}
              drivers={drivers}
              onSubmit={handleSaveTrip}
              initialTrip={editTrip}
              isSubmitting={isSubmitting}
            />
          )}
          
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Trip Drawer */}
      <Drawer open={bookingOpen} onOpenChange={setBookingOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Book New Trip</DrawerTitle>
            <DrawerDescription>
              Fill in the details to schedule a new trip.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2 overflow-y-auto">
            <TripForm
              clients={clients}
              vehicles={vehicles}
              drivers={drivers}
              onSubmit={handleSaveTrip}
              isSubmitting={isSubmitting}
            />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default Trips;
