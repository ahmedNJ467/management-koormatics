
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTripsData } from "@/hooks/use-trips-data";
import { useTripDetails } from "@/hooks/use-trip-details";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Table as TableIcon } from "lucide-react";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { TripCalendarView } from "@/components/trips/TripCalendarView";
import { TripListView } from "@/components/trips/TripListView";
import { TripDetailView } from "@/components/trips/TripDetailView";
import { TripForm } from "@/components/trips/TripForm";
import { AssignDriverDialog } from "@/components/trips/AssignDriverDialog";
import { TripMessageDialog } from "@/components/trips/TripMessageDialog";
import { DeleteTripDialog } from "@/components/trips/DeleteTripDialog";
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

  // Fetch all data
  const { trips, isLoading, clients, vehicles, drivers } = useTripsData();
  
  // Fetch trip details data when a trip is viewed
  const { messages, assignments } = useTripDetails(viewTrip);

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

  // Handle operations with the refactored functions
  const handleTripStatusUpdate = (tripId: string, status: TripStatus) => 
    updateTripStatus(tripId, status, viewTrip, setViewTrip, toast, queryClient);
    
  const handleTripDelete = () => 
    deleteTrip(tripToDelete, viewTrip, editTrip, setViewTrip, setEditTrip, setDeleteDialogOpen, setTripToDelete, toast, queryClient);
  
  const handleTripFormSubmit = (event: React.FormEvent<HTMLFormElement>) => 
    handleSaveTrip(event, editTrip, setEditTrip, setBookingOpen, toast, queryClient);
  
  const handleDriverAssignment = () => 
    handleAssignDriver(tripToAssign, assignDriver, assignNote, setAssignOpen, setTripToAssign, setAssignDriver, setAssignNote, toast, queryClient);
  
  const handleMessageSend = () => 
    handleSendMessage(tripToMessage || viewTrip, newMessage, setNewMessage, toast, queryClient);

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
          updateTripStatus={handleTripStatusUpdate}
        />
      )}

      {/* Trip Form Dialog (Edit & Create) */}
      <Dialog 
        open={!!editTrip || bookingOpen} 
        onOpenChange={(open) => !open && (setEditTrip(null), setBookingOpen(false))}
      > 
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
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
        assignDriver={assignDriver}
        assignNote={assignNote}
        drivers={drivers}
        onDriverChange={setAssignDriver}
        onNoteChange={setAssignNote}
        onAssign={handleDriverAssignment}
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
        onDelete={handleTripDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTripToDelete(null);
        }}
      />
    </div>
  );
}
