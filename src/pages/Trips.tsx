import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Table as TableIcon } from "lucide-react";
import { DisplayTrip, TripStatus, TripType } from "@/lib/types/trip";
import { Client } from "@/components/clients/hooks/use-clients-query";
import { Driver } from "@/lib/types/driver";
import { Vehicle } from "@/lib/types/vehicle";

// Import our refactored components
import TripCalendarView from "@/components/trips/TripCalendarView";
import TripTableView from "@/components/trips/TripTableView";
import TripDetailsDialog from "@/components/trips/TripDetailsDialog";
import TripBookingDialog from "@/components/trips/TripBookingDialog";
import TripAssignDialog from "@/components/trips/TripAssignDialog";
import TripMessageDialog from "@/components/trips/TripMessageDialog";
import TripDeleteDialog from "@/components/trips/TripDeleteDialog";
import TripFilterBar from "@/components/trips/TripFilterBar";

// Import our helper functions
import { 
  formatTripId, 
  formatStatus, 
  formatTripType, 
  formatCurrency, 
  formatDate, 
  formatTime, 
  formatDateTime, 
  getStatusColor, 
  getTripTypeIcon,
  parseFlightDetails,
  parsePassengers,
  serviceTypeMap,
  createRecurringTrips
} from "@/components/trips/utils/trip-helpers";

// Import query hooks
import { useTripsQuery, useTripMessagesQuery, useTripAssignmentsQuery } from "@/components/trips/hooks/use-trips-query";

export default function Trips() {
  const { toast } = useToast();
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useTripsQuery();

  // Fetch trip messages for the selected trip
  const { data: messages } = useTripMessagesQuery(viewTrip?.id || null);

  // Fetch trip assignments for the selected trip
  const { data: assignments } = useTripAssignmentsQuery(viewTrip?.id || null);

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

  // Update trip status
  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status changed to ${formatStatus(status)}`,
      });
      
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

      if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
      if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
      
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Handle saving a trip (new or edit)
  const handleSaveTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const uiServiceType = formData.get("service_type") as string;
    const dbServiceType = serviceTypeMap[uiServiceType];
    const isRecurringChecked = formData.get("is_recurring") === "on";
    
    let notes = formData.get("special_notes") as string || "";
    if (uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff") {
      const flight = formData.get("flight_number") as string;
      const airline = formData.get("airline") as string;
      const terminal = formData.get("terminal") as string;
      
      if (flight) notes += `\nFlight: ${flight}`;
      if (airline) notes += `\nAirline: ${airline}`;
      if (terminal) notes += `\nTerminal: ${terminal}`;
    }
    
    const clientId = formData.get("client_id") as string;
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient?.type === "organization") {
      const passengerInputs = form.querySelectorAll('input[placeholder^="Passenger"]');
      const passengersList: string[] = [];
      
      passengerInputs.forEach((input) => {
        const value = (input as HTMLInputElement).value;
        if (value.trim()) {
          passengersList.push(value.trim());
        }
      });
      
      if (passengersList.length > 0) {
        notes += `\n\nPassengers:\n${passengersList.join('\n')}`;
      }
    }
    
    try {
      if (editTrip) {
        const tripUpdateData = {
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
          notes: notes || null,
        };
        
        const { error } = await supabase
          .from("trips")
          .update(tripUpdateData)
          .eq("id", editTrip.id);
        
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else if (isRecurringChecked) {
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
        const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(uiServiceType);
      
        const tripData = {
          client_id: formData.get("client_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          driver_id: formData.get("driver_id") as string,
          date: formData.get("date") as string,
          start_time: formData.get("time") as string,
          end_time: needsReturnTime ? (formData.get("return_time") as string) : null,
          type: dbServiceType,
          status: "scheduled" as TripStatus,
          amount: 0,
          pickup_location: formData.get("pickup_location") as string || null,
          dropoff_location: formData.get("dropoff_location") as string || null,
          notes: notes || null,
        };

        const { error } = await supabase
          .from("trips")
          .insert(tripData);
        
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
      const { error } = await supabase.from('trip_assignments').insert({
        trip_id: tripToAssign.id,
        driver_id: assignDriver,
        assigned_at: new Date().toISOString(),
        status: "pending",
        notes: assignNote || null
      });
      
      if (error) throw error;
      
      const { error: updateError } = await supabase
        .from("trips")
        .update({ driver_id: assignDriver })
        .eq("id", tripToAssign.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });
      
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
      const { error } = await supabase.from('trip_messages').insert({
        trip_id: tripToMessage.id,
        sender_type: "admin",
        sender_name: "Fleet Manager",
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
      setMessageOpen(false);
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
      formatTripId(trip.id).includes(searchTerm.toUpperCase());
    
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

      <TripFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {calendarView ? (
        <TripCalendarView 
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          filteredTrips={filteredTrips}
          setViewTrip={setViewTrip}
          getStatusColor={getStatusColor}
          formatTime={formatTime}
        />
      ) : (
        <TripTableView 
          filteredTrips={filteredTrips}
          formatTripId={formatTripId}
          formatDate={formatDate}
          formatTime={formatTime}
          formatStatus={formatStatus}
          formatTripType={formatTripType}
          getStatusColor={getStatusColor}
          getTripTypeIcon={getTripTypeIcon}
          setViewTrip={setViewTrip}
          setEditTrip={setEditTrip}
          setTripToMessage={setTripToMessage}
          setMessageOpen={setMessageOpen}
          setTripToAssign={setTripToAssign}
          setAssignOpen={setAssignOpen}
          updateTripStatus={updateTripStatus}
          setTripToDelete={setTripToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          setBookingOpen={setBookingOpen}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      )}

      <TripDetailsDialog 
        viewTrip={viewTrip}
        setViewTrip={setViewTrip}
        setEditTrip={setEditTrip}
        setTripToMessage={setTripToMessage}
        setMessageOpen={setMessageOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formatDate={formatDate}
        formatTime={formatTime}
        formatDateTime={formatDateTime}
        formatStatus={formatStatus}
        getStatusColor={getStatusColor}
        messages={messages}
        assignments={assignments}
      />
      
      <TripBookingDialog 
        bookingOpen={bookingOpen}
        editTrip={editTrip}
        setBookingOpen={setBookingOpen}
        setEditTrip={setEditTrip}
        clients={clients}
        vehicles={vehicles}
        drivers={drivers}
        handleSaveTrip={handleSaveTrip}
        parsePassengers={parsePassengers}
        parseFlightDetails={parseFlightDetails}
      />
      
      <TripAssignDialog 
        assignOpen={assignOpen}
        setAssignOpen={setAssignOpen}
        tripToAssign={tripToAssign}
        assignDriver={assignDriver}
        setAssignDriver={setAssignDriver}
        assignNote={assignNote}
        setAssignNote={setAssignNote}
        handleAssignDriver={handleAssignDriver}
        drivers={drivers}
      />
      
      <TripMessageDialog 
        messageOpen={messageOpen}
        setMessageOpen={setMessageOpen}
        tripToMessage={tripToMessage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
      />
      
      <TripDeleteDialog 
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleteTrip={deleteTrip}
      />
    </div>
  );
}
