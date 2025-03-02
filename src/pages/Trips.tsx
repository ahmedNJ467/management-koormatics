import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Table as TableIcon } from "lucide-react";
import {
  TripStatus,
  TripType,
  DbServiceType,
  Trip,
  DisplayTrip,
  mapDatabaseFieldsToTrip,
  mapTripTypeToDbServiceType
} from "@/lib/types/trip";
import { TripCalendarView } from "@/components/trips/TripCalendarView";
import { TripListView } from "@/components/trips/TripListView";
import { TripDetailView } from "@/components/trips/TripDetailView";
import { TripForm } from "@/components/trips/TripForm";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { DeleteTripDialog } from "@/components/trips/DeleteTripDialog";
import { DbTripData, TripMessageData, TripAssignmentData } from "@/components/trips/types";
import { Driver, Vehicle, Client } from "@/lib/types";

// Map UI service types to database service_type values
// Making sure all TripType values are included
const serviceTypeMap: Record<string, TripType> = {
  "airport_pickup": "airport_pickup",
  "airport_dropoff": "airport_dropoff",
  "round_trip": "round_trip",
  "security_escort": "security_escort",
  "one_way": "one_way_transfer",
  "full_day_hire": "full_day",
  "hourly": "hourly",
  "multi_day": "multi_day",
  "other": "other"
};

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [assignDriver, setAssignDriver] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [calendarView, setCalendarView] = useState(false);

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, type),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip: DbTripData) => {
        return mapDatabaseFieldsToTrip(trip);
      });
    },
  });

  // Fetch trip messages
  const { data: messages } = useQuery({
    queryKey: ["tripMessages", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the messages
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", viewTrip.id)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data as TripMessageData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch trip assignments
  const { data: assignments } = useQuery({
    queryKey: ["tripAssignments", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the assignments with driver details
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(`
          *,
          drivers:driver_id(name, avatar_url)
        `)
        .eq("trip_id", viewTrip.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.drivers?.name,
        driver_avatar: assignment.drivers?.avatar_url
      })) as TripAssignmentData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch clients, vehicles, and drivers for forms
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, type")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .eq("status", "active")
        .order("make");
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, avatar_url, contact")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Driver[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("trips-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trips" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to messages changes
  useEffect(() => {
    if (!viewTrip) return;
    
    const channel = supabase
      .channel("trip-messages-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${viewTrip.id}` }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["tripMessages", viewTrip.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, viewTrip]);

  // Update trip status
  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    try {
      // Note: We only update a custom status field in our app, not in DB schema
      const { error } = await supabase
        .from("trips")
        .update({ 
          // Store status in special_instructions with a prefix
          special_instructions: `STATUS:${status}${
            viewTrip?.special_instructions ? 
              `\n\n${viewTrip.special_instructions.replace(/^STATUS:[a-z_]+\n\n/i, '')}` : 
              ''
          }`
        })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status changed to ${status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      
      // Update local viewTrip state if it's the current trip
      if (viewTrip && viewTrip.id === tripId) {
        setViewTrip({...viewTrip, status});
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    }
  };

  // Delete trip
  const deleteTrip = async () => {
    if (!tripToDelete) return;
    
    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripToDelete);

      if (error) throw error;

      toast({
        title: "Trip deleted",
        description: "Trip has been deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setDeleteDialogOpen(false);
      setTripToDelete(null);
      
      // Close any open dialogs if they were showing the deleted trip
      if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
      if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Create recurring trips
  const createRecurringTrips = async (formData: FormData, occurrences: number, frequency: "daily" | "weekly" | "monthly") => {
    const trips = [];
    const baseDate = new Date(formData.get("date") as string);
    
    for (let i = 0; i < occurrences; i++) {
      let tripDate = new Date(baseDate);
      
      if (i > 0) {
        switch (frequency) {
          case "daily":
            tripDate = addDays(tripDate, i);
            break;
          case "weekly":
            tripDate = addDays(tripDate, i * 7);
            break;
          case "monthly":
            tripDate = new Date(tripDate.setMonth(tripDate.getMonth() + i));
            break;
        }
      }
      
      const formServiceType = formData.get("service_type") as string;
      const tripType: TripType = serviceTypeMap[formServiceType] || "other";
      const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
      
      const formTime = formData.get("time") as string;
      const formReturnTime = formData.get("return_time") as string;
      
      // Prepare trip data for insertion into the DB
      const tripData = {
        client_id: formData.get("client_id") as string,
        vehicle_id: formData.get("vehicle_id") as string,
        driver_id: formData.get("driver_id") as string,
        date: format(tripDate, "yyyy-MM-dd"),
        time: formTime,
        return_time: formReturnTime || null,
        service_type: dbServiceType,
        amount: 0, // Default amount
        pickup_location: formData.get("pickup_location") as string || null,
        dropoff_location: formData.get("dropoff_location") as string || null,
        special_instructions: `STATUS:scheduled\n\n${formData.get("special_notes") as string || ""}`,
      };
      
      trips.push(tripData);
    }
    
    return trips;
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const uiServiceType = formData.get("service_type") as string;
    const tripType: TripType = (serviceTypeMap[uiServiceType] || "other") as TripType;
    const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
    const isRecurringChecked = formData.get("is_recurring") === "on";
    
    // Add flight details to notes if it's an airport trip
    let notes = formData.get("special_notes") as string || "";
    if (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") {
      const flight = formData.get("flight_number") as string;
      const airline = formData.get("airline") as string;
      const terminal = formData.get("terminal") as string;
      
      if (flight) notes += `\nFlight: ${flight}`;
      if (airline) notes += `\nAirline: ${airline}`;
      if (terminal) notes += `\nTerminal: ${terminal}`;
    }
    
    // Add status prefix to notes
    const statusValue = formData.get("status") as TripStatus || "scheduled";
    notes = `STATUS:${statusValue}\n\n${notes}`;
    
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
            time: formData.get("time") as string,
            return_time: formData.get("return_time") as string || null,
            service_type: dbServiceType,
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            special_instructions: notes || null,
          })
          .eq("id", editTrip.id);
        
        if (error) throw error;

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
        
        if (error) throw error;

        toast({
          title: "Recurring trips created",
          description: `${trips.length} trips have been scheduled successfully`,
        });
        
        setBookingOpen(false);
      } else {
        // Create new single trip
        const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
        
        const { error } = await supabase
          .from("trips")
          .insert({
            client_id: formData.get("client_id") as string,
            vehicle_id: formData.get("vehicle_id") as string,
            driver_id: formData.get("driver_id") as string,
            date: formData.get("date") as string,
            time: formData.get("time") as string,
            return_time: needsReturnTime ? (formData.get("return_time") as string) : null,
            service_type: dbServiceType,
            amount: 0, // Default amount
            pickup_location: formData.get("pickup_location") as string || null,
            dropoff_location: formData.get("dropoff_location") as string || null,
            special_instructions: notes || null,
          });
        
        if (error) {
          console.error("Error creating trip:", error);
          throw error;
        }

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

  // Handle assigning a driver
  const handleAssignDriver = async () => {
    if (!tripToAssign || !assignDriver) return;
    
    try {
      // Skip the RPC and use direct insertion
      const { error } = await supabase.from('trip_assignments').insert({
        trip_id: tripToAssign.id,
        driver_id: assignDriver,
        assigned_at: new Date().toISOString(),
        status: "pending",
        notes: assignNote || null
      });
      
      if (error) throw error;
      
      // Update trip with new driver
      const { error: updateError } = await supabase
        .from("trips")
        .update({ driver_id: assignDriver })
        .eq("id", tripToAssign.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["tripAssignments", tripToAssign.id] });
      
      setAssignOpen(false);
      setTripToAssign(null);
      setAssignDriver("");
      setAssignNote("");
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!tripToMessage || !newMessage.trim()) return;
    
    try {
      // Skip the RPC and use direct insertion
      const { error } = await supabase.from('trip_messages').insert({
        trip_id: tripToMessage.id,
        sender_type: "admin",
        sender_name: "Fleet Manager", // In a real app, use the current user's name
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: false
      });
      
      if (error) throw error;
      
      toast({
        title: "Message sent",
        description: "Your message has been sent",
      });
      
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["tripMessages", tripToMessage.id] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Filter trips based on search and status filter
  const filteredTrips = trips?.filter(trip => {
    const matchesSearch = 
      searchTerm === "" ||
      trip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.id.substring(0, 8).toUpperCase().includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (tripsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
            <p className="text-muted-foreground">Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
          <p className="text-muted-foreground">Manage trip reservations and driver assignments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCalendarView(!calendarView)}
          >
            {calendarView ? <TableIcon className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
            {calendarView ? "List View" : "Calendar View"}
          </Button>
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Book Trip
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar or List View */}
      {calendarView ? (
        <TripCalendarView 
          filteredTrips={filteredTrips} 
          setViewTrip={setViewTrip} 
        />
      ) : (
        <TripListView 
          filteredTrips={filteredTrips}
          setViewTrip={setViewTrip}
          setEditTrip={setEditTrip}
          setTripToMessage={setTripToMessage}
          setMessageOpen={setMessageOpen}
          setTripToAssign={setTripToAssign}
          setAssignOpen={setAssignOpen}
          setTripToDelete={setTripToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          updateTripStatus={updateTripStatus}
        />
      )}

      {/* Trip Form Dialog (Edit & Create) */}
      <Dialog 
        open={!!editTrip || bookingOpen} 
        onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false))}
      > 
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
            <DialogDescription>
              {editTrip 
                ? `Edit trip details for ${editTrip.client_name}`
                : "Create a new trip reservation"}
            </DialogDescription>
          </DialogHeader>

          <TripForm
            editTrip={editTrip}
            clients={clients}
            vehicles={vehicles}
            drivers={drivers}
            onClose={() => {
              setEditTrip(null);
              setBookingOpen(false);
            }}
            onSubmit={handleSaveTrip}
          />
        </DialogContent>
      </Dialog>

      {/* Trip Detail View Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          {viewTrip && (
            <TripDetailView
              viewTrip={viewTrip}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              messages={messages}
              assignments={assignments}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              setTripToAssign={setTripToAssign}
              setAssignOpen={setAssignOpen}
              setTripToMessage={setTripToMessage}
              setMessageOpen={setMessageOpen}
              setEditTrip={setEditTrip}
              setTripToDelete={setTripToDelete}
              setDeleteDialogOpen={setDeleteDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <AssignDriverDialog
        open={assignOpen}
        tripToAssign={tripToAssign}
        assignDriver={assignDriver}
        assignNote={assignNote}
        drivers={drivers}
        onDriverChange={setAssignDriver}
        onNoteChange={setAssignNote}
        onAssign={handleAssignDriver}
        onClose={() => {
          setAssignOpen(false);
          setTripToAssign(null);
          setAssignDriver("");
          setAssignNote("");
        }}
      />

      {/* Send Message Dialog */}
      <TripMessageDialog
        open={messageOpen}
        tripToMessage={tripToMessage}
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
        onClose={() => {
          setMessageOpen(false);
          setTripToMessage(null);
          setNewMessage("");
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTripDialog
        open={deleteDialogOpen}
        onDelete={deleteTrip}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTripToDelete(null);
        }}
      />
    </div>
  );
}
