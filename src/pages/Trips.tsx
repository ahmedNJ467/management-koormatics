
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Table as TableIcon } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

// Import our refactored components
import TripCalendarView from "@/components/trips/TripCalendarView";
import TripTableView from "@/components/trips/TripTableView";
import TripDetailsDialog from "@/components/trips/TripDetailsDialog";
import TripBookingDialog from "@/components/trips/TripBookingDialog";
import TripAssignDialog from "@/components/trips/TripAssignDialog";
import TripMessageDialog from "@/components/trips/TripMessageDialog";
import TripDeleteDialog from "@/components/trips/TripDeleteDialog";
import TripFilterBar from "@/components/trips/TripFilterBar";

// Import our refactored hooks and utils
import { 
  useTripsActions, 
  useTripsState, 
  useTripsQuery, 
  useTripMessagesQuery,
  useTripAssignmentsQuery
} from "@/components/trips/hooks/trips-hooks";

// Import data fetching hooks for forms
import { 
  useClientsQuery, 
  useVehiclesQuery, 
  useDriversQuery 
} from "@/components/trips/hooks/form-data-hooks";

export default function Trips() {
  const { toast } = useToast();
  
  // Get trip states and actions from custom hooks
  const {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    viewTrip, setViewTrip,
    editTrip, setEditTrip,
    bookingOpen, setBookingOpen,
    assignOpen, setAssignOpen,
    messageOpen, setMessageOpen,
    tripToAssign, setTripToAssign,
    tripToMessage, setTripToMessage,
    assignDriver, setAssignDriver,
    assignNote, setAssignNote,
    newMessage, setNewMessage,
    deleteDialogOpen, setDeleteDialogOpen,
    tripToDelete, setTripToDelete,
    activeTab, setActiveTab,
    calendarView, setCalendarView,
    currentMonth, setCurrentMonth
  } = useTripsState();

  const {
    updateTripStatus,
    deleteTrip,
    handleSaveTrip,
    handleAssignDriver,
    handleSendMessage
  } = useTripsActions(toast, viewTrip, setViewTrip, editTrip, setEditTrip, 
    tripToDelete, setDeleteDialogOpen, setTripToDelete, setBookingOpen,
    tripToMessage, newMessage, setNewMessage, setMessageOpen,
    tripToAssign, assignDriver, setAssignDriver, assignNote, setAssignNote, setAssignOpen);

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useTripsQuery();

  // Fetch trip messages for the selected trip
  const { data: messages } = useTripMessagesQuery(viewTrip?.id || null);

  // Fetch trip assignments for the selected trip
  const { data: assignments } = useTripAssignmentsQuery(viewTrip?.id || null);

  // Fetch clients, vehicles, and drivers for forms
  const { data: clients } = useClientsQuery();
  const { data: vehicles } = useVehiclesQuery();
  const { data: drivers } = useDriversQuery();

  // Apply filters to trips
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
            {calendarView ? <TableIcon className="mr-2 h-4 w-4" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
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
        />
      ) : (
        <TripTableView 
          filteredTrips={filteredTrips}
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
