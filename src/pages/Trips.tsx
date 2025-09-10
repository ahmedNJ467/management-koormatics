import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTripsData } from "@/hooks/use-trips-data";
import { useTripDetails } from "@/hooks/use-trip-details";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { useState } from "react";

import { TripHeader } from "@/components/trips/TripHeader";
import { TripSearch } from "@/components/trips/TripSearch";
import { TripListView } from "@/components/trips/list-view/TripListView";
import { TripCalendarView } from "@/components/trips/TripCalendarView";
import { TripDialogs } from "@/components/trips/TripDialogs";
import { TripForm } from "@/components/trips/trip-form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTripState } from "@/components/trips/hooks/use-trip-state";
import { useTripFilters } from "@/components/trips/hooks/use-trip-filters";

import {
  updateTripStatus,
  deleteTrip,
  handleSaveTrip,
  handleAssignDriver,
  handleSendMessage,
} from "@/components/trips/trip-operations";

import { supabase } from "@/integrations/supabase/client";

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
    setCalendarView,
  } = useTripState();

  const [assignVehicleOpen, setAssignVehicleOpen] = useState(false);
  const [tripToAssignVehicle, setTripToAssignVehicle] =
    useState<DisplayTrip | null>(null);

  // Fetch all data
  const { trips, isLoading, clients, vehicles, drivers } = useTripsData();

  // Filter trips based on search and status filter
  const { filteredTrips } = useTripFilters(trips, searchTerm, statusFilter);

  // Fetch trip details data when a trip is viewed
  const { messages, assignments } = useTripDetails(viewTrip);

  // Provide default values to prevent undefined errors
  const safeMessages = messages || [];
  const safeAssignments = assignments || [];

  // Helper function to wrap toast for passing to operations
  const toastWrapper = (props: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => toast(props);

  // Handle operations with the refactored functions
  const handleTripStatusUpdate = (tripId: string, status: TripStatus) =>
    updateTripStatus(
      tripId,
      status,
      viewTrip,
      setViewTrip,
      toastWrapper,
      queryClient
    );

  const handleTripDelete = () =>
    deleteTrip(
      tripToDelete,
      viewTrip,
      editTrip,
      setViewTrip,
      setEditTrip,
      setDeleteDialogOpen,
      setTripToDelete,
      toastWrapper,
      queryClient
    );

  const handleTripFormSubmit = (event: React.FormEvent<HTMLFormElement>) =>
    handleSaveTrip(
      event,
      editTrip,
      setEditTrip,
      setBookingOpen,
      toastWrapper,
      queryClient
    );

  const handleDriverAssignment = () =>
    handleAssignDriver(
      tripToAssign,
      assignDriver,
      assignNote,
      setAssignOpen,
      setTripToAssign,
      setAssignDriver,
      setAssignNote,
      toastWrapper,
      queryClient
    );

  const handleMessageSend = () =>
    handleSendMessage(
      tripToMessage || viewTrip,
      newMessage,
      setNewMessage,
      toastWrapper,
      queryClient
    );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 px-6 space-y-6">
          <div className="border-b border-border pb-4 pt-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Trips</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
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
            setTripToAssignVehicle={setTripToAssignVehicle}
            setAssignVehicleOpen={setAssignVehicleOpen}
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
          trips={trips}
          messages={safeMessages}
          assignments={safeAssignments as any}
          assignVehicleOpen={assignVehicleOpen}
          tripToAssignVehicle={tripToAssignVehicle}
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
          setAssignVehicleOpen={setAssignVehicleOpen}
          setTripToAssignVehicle={setTripToAssignVehicle}
          handleTripFormSubmit={handleTripFormSubmit}
          handleDriverAssignment={handleDriverAssignment}
          handleMessageSend={handleMessageSend}
          queryClient={queryClient}
        />
      </div>
    </div>
  );
}
