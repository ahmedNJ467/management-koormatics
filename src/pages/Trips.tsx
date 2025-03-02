
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTripsData } from "@/hooks/use-trips-data";
import { useTripDetails } from "@/hooks/use-trip-details";
import { TripStatus } from "@/lib/types/trip";

import { TripHeader } from "@/components/trips/TripHeader";
import { TripSearch } from "@/components/trips/TripSearch";
import { TripListView } from "@/components/trips/TripListView";
import { TripCalendarView } from "@/components/trips/TripCalendarView";
import { TripDialogs } from "@/components/trips/TripDialogs";
import { useTripState } from "@/components/trips/hooks/use-trip-state";
import { useTripFilters } from "@/components/trips/hooks/use-trip-filters";

import { 
  updateTripStatus, 
  deleteTrip, 
  handleSaveTrip, 
  handleAssignDriver, 
  handleSendMessage 
} from "@/components/trips/trip-operations";

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use custom hook for all trip-related state
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewTrip,
    setViewTrip,
    editTrip,
    setEditTrip,
    bookingOpen,
    setBookingOpen,
    assignOpen,
    setAssignOpen,
    messageOpen, 
    setMessageOpen,
    tripToAssign,
    setTripToAssign,
    tripToMessage,
    setTripToMessage,
    assignDriver,
    setAssignDriver,
    assignNote,
    setAssignNote,
    newMessage, 
    setNewMessage,
    deleteDialogOpen,
    setDeleteDialogOpen,
    tripToDelete,
    setTripToDelete,
    activeTab,
    setActiveTab,
    calendarView,
    setCalendarView
  } = useTripState();

  // Fetch all data
  const { trips, isLoading, clients, vehicles, drivers } = useTripsData();
  
  // Filter trips based on search and status filter
  const { filteredTrips } = useTripFilters(trips, searchTerm, statusFilter);
  
  // Fetch trip details data when a trip is viewed
  const { messages, assignments } = useTripDetails(viewTrip);

  // Helper function to wrap toast for passing to operations
  const toastWrapper = (props: { 
    title: string; 
    description: string;
    variant?: "default" | "destructive";
  }) => toast(props);

  // Handle operations with the refactored functions
  const handleTripStatusUpdate = (tripId: string, status: TripStatus) => 
    updateTripStatus(tripId, status, viewTrip, setViewTrip, toastWrapper, queryClient);
    
  const handleTripDelete = () => 
    deleteTrip(tripToDelete, viewTrip, editTrip, setViewTrip, setEditTrip, setDeleteDialogOpen, setTripToDelete, toastWrapper, queryClient);
  
  const handleTripFormSubmit = (event: React.FormEvent<HTMLFormElement>) => 
    handleSaveTrip(event, editTrip, setEditTrip, setBookingOpen, toastWrapper, queryClient);
  
  const handleDriverAssignment = () => 
    handleAssignDriver(tripToAssign, assignDriver, assignNote, setAssignOpen, setTripToAssign, setAssignDriver, setAssignNote, toastWrapper, queryClient);
  
  const handleMessageSend = () => 
    handleSendMessage(tripToMessage || viewTrip, newMessage, setNewMessage, toastWrapper, queryClient);

  if (isLoading) {
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
      {/* Header */}
      <TripHeader 
        calendarView={calendarView} 
        setCalendarView={setCalendarView} 
        setBookingOpen={setBookingOpen} 
      />

      {/* Search and Filter */}
      <TripSearch 
        searchTerm={searchTerm} 
        statusFilter={statusFilter} 
        setSearchTerm={setSearchTerm} 
        setStatusFilter={setStatusFilter} 
      />

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
          updateTripStatus={handleTripStatusUpdate}
        />
      )}

      {/* Dialogs */}
      <TripDialogs
        viewTrip={viewTrip}
        editTrip={editTrip}
        bookingOpen={bookingOpen}
        assignOpen={assignOpen}
        messageOpen={messageOpen}
        deleteDialogOpen={deleteDialogOpen}
        tripToAssign={tripToAssign}
        tripToMessage={tripToMessage}
        tripToDelete={tripToDelete}
        assignDriver={assignDriver}
        assignNote={assignNote}
        newMessage={newMessage}
        activeTab={activeTab}
        clients={clients}
        vehicles={vehicles}
        drivers={drivers}
        messages={messages}
        assignments={assignments}
        setViewTrip={setViewTrip}
        setEditTrip={setEditTrip}
        setBookingOpen={setBookingOpen}
        setAssignOpen={setAssignOpen}
        setMessageOpen={setMessageOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setTripToAssign={setTripToAssign}
        setTripToMessage={setTripToMessage}
        setTripToDelete={setTripToDelete}
        setAssignDriver={setAssignDriver}
        setAssignNote={setAssignNote}
        setNewMessage={setNewMessage}
        setActiveTab={setActiveTab}
        handleTripFormSubmit={handleTripFormSubmit}
        handleDriverAssignment={handleDriverAssignment}
        handleMessageSend={handleMessageSend}
        queryClient={queryClient}
      />
    </div>
  );
}
