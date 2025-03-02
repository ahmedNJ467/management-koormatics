import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TripForm } from "@/components/trips/TripForm";
import { TripDetailView } from "@/components/trips/TripDetailView";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { DeleteTripDialog } from "@/components/trips/DeleteTripDialog";
import { DisplayTrip } from "@/lib/types/trip";
import { Client, Driver, Vehicle } from "@/lib/types";
import { TripMessage, TripAssignment } from "@/lib/types/trip/communication";
import { QueryClient } from "@tanstack/react-query";

interface TripDialogsProps {
  viewTrip: DisplayTrip | null;
  editTrip: DisplayTrip | null;
  bookingOpen: boolean;
  assignOpen: boolean;
  messageOpen: boolean;
  deleteDialogOpen: boolean;
  tripToAssign: DisplayTrip | null;
  tripToMessage: DisplayTrip | null;
  tripToDelete: string | null;
  assignDriver: string;
  assignNote: string;
  newMessage: string;
  activeTab: string;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  messages: TripMessage[];
  assignments: TripAssignment[];
  setViewTrip: (trip: DisplayTrip | null) => void;
  setEditTrip: (trip: DisplayTrip | null) => void;
  setBookingOpen: (open: boolean) => void;
  setAssignOpen: (open: boolean) => void;
  setMessageOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setTripToAssign: (trip: DisplayTrip | null) => void;
  setTripToMessage: (trip: DisplayTrip | null) => void;
  setTripToDelete: (id: string | null) => void;
  setAssignDriver: (id: string) => void;
  setAssignNote: (note: string) => void;
  setNewMessage: (message: string) => void;
  setActiveTab: (tab: string) => void;
  handleTripFormSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleDriverAssignment: () => Promise<void>;
  handleMessageSend: () => Promise<void>;
  queryClient: QueryClient;
}

export function TripDialogs({
  viewTrip,
  editTrip,
  bookingOpen,
  assignOpen,
  messageOpen,
  deleteDialogOpen,
  tripToAssign,
  tripToMessage,
  tripToDelete,
  assignDriver,
  assignNote,
  newMessage,
  activeTab,
  clients,
  vehicles,
  drivers,
  messages,
  assignments,
  setViewTrip,
  setEditTrip,
  setBookingOpen,
  setAssignOpen,
  setMessageOpen,
  setDeleteDialogOpen,
  setTripToAssign,
  setTripToMessage,
  setTripToDelete,
  setAssignDriver,
  setAssignNote,
  setNewMessage,
  setActiveTab,
  handleTripFormSubmit,
  handleDriverAssignment,
  handleMessageSend,
  queryClient
}: TripDialogsProps) {
  const onViewTripOpenChange = (open: boolean) => {
    if (!open) {
      setViewTrip(null);
    }
  };

  return (
    <>
      {/* Trip Form Dialog (Edit & Create) */}
      <Dialog 
        open={!!editTrip || bookingOpen} 
        onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false))}
      > 
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogTitle>
            {editTrip ? "Edit Trip" : "Book New Trip"}
          </DialogTitle>
          <DialogDescription>
            {editTrip ? "Update the trip details below." : "Enter the trip details to book a new trip."}
          </DialogDescription>
          <TripForm
            editTrip={editTrip}
            clients={clients}
            vehicles={vehicles}
            drivers={drivers}
            onClose={() => {
              setEditTrip(null);
              setBookingOpen(false);
            }}
            onSubmit={handleTripFormSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* View Trip Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={onViewTripOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewTrip && (
            <TripDetailView
              viewTrip={viewTrip}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              messages={messages || []}
              assignments={assignments || []}
              drivers={drivers || []}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleMessageSend}
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
        onClose={() => {
          setAssignOpen(false);
          setTripToAssign(null);
          setAssignDriver("");
          setAssignNote("");
        }}
        onDriverAssigned={() => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
          if (viewTrip) {
            queryClient.invalidateQueries({ queryKey: ["tripAssignments", viewTrip.id] });
          }
        }}
      />

      {/* Send Message Dialog */}
      <TripMessageDialog
        open={messageOpen}
        tripToMessage={tripToMessage}
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleMessageSend}
        onClose={() => {
          setMessageOpen(false);
          setTripToMessage(null);
          setNewMessage("");
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTripDialog
        open={deleteDialogOpen}
        tripId={tripToDelete || ""}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTripToDelete(null);
        }}
        onTripDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }}
      />
    </>
  );
}
