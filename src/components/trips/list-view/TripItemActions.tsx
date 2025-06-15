
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { 
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  FileText, MessageCircle, User, Calendar, Clock, 
  Check, X, Trash, Car 
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateInvoiceForTrip } from "@/lib/invoice-utils";

interface TripItemActionsProps {
  trip: DisplayTrip;
  setViewTrip: (trip: DisplayTrip) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToAssignVehicle: (trip: DisplayTrip) => void;
  setAssignVehicleOpen: (open: boolean) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
}

export function TripItemActions({
  trip,
  setViewTrip,
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  setTripToAssign,
  setAssignOpen,
  setTripToAssignVehicle,
  setAssignVehicleOpen,
  setTripToDelete,
  setDeleteDialogOpen,
  updateTripStatus
}: TripItemActionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoiceForTrip(trip);
      toast({
        title: "Success",
        description: `Invoice generated for trip ${trip.id.substring(0, 8)}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error: any) {
      toast({
        title: "Error generating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => setViewTrip(trip)}>
        <FileText className="h-4 w-4 mr-2" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setEditTrip(trip)}>
        <FileText className="h-4 w-4 mr-2" />
        Edit Trip
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setTripToMessage(trip);
        setMessageOpen(true);
      }}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Send Message
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setTripToAssign(trip);
        setAssignOpen(true);
      }}>
        <User className="h-4 w-4 mr-2" />
        Assign Driver
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setTripToAssignVehicle(trip);
        setAssignVehicleOpen(true);
      }}>
        <Car className="h-4 w-4 mr-2" />
        Assign Vehicle
      </DropdownMenuItem>

      {trip.status === "completed" && !trip.invoice_id && (
        <DropdownMenuItem onClick={handleGenerateInvoice}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Invoice
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      {/* Status change options */}
      <DropdownMenuLabel>Change Status</DropdownMenuLabel>

      {trip.status !== "scheduled" && (
        <DropdownMenuItem 
          onClick={() => updateTripStatus(trip.id, "scheduled")}
          className="text-blue-600"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Set as Scheduled
        </DropdownMenuItem>
      )}

      {trip.status !== "in_progress" && (
        <DropdownMenuItem 
          onClick={() => updateTripStatus(trip.id, "in_progress")}
          className="text-yellow-600"
        >
          <Clock className="h-4 w-4 mr-2" />
          Set as In Progress
        </DropdownMenuItem>
      )}

      {trip.status !== "completed" && (
        <DropdownMenuItem 
          onClick={() => updateTripStatus(trip.id, "completed")}
          className="text-green-600"
        >
          <Check className="h-4 w-4 mr-2" />
          Mark as Completed
        </DropdownMenuItem>
      )}

      {trip.status !== "cancelled" && (
        <DropdownMenuItem 
          onClick={() => updateTripStatus(trip.id, "cancelled")}
          className="text-red-600"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel Trip
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={() => {
          setTripToDelete(trip.id);
          setDeleteDialogOpen(true);
        }}
        className="text-red-600"
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete Trip
      </DropdownMenuItem>
    </>
  );
}
