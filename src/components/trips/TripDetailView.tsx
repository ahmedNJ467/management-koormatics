import { format } from "date-fns";
import { 
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DialogClose, DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, MessageCircle, User, Calendar, Clock,
  ArrowRight, MapPin, Users, Edit, Trash
} from "lucide-react";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { TripMessage } from "@/lib/types/trip/communication";
import { TripAssignment } from "@/lib/types/trip/communication";
import { TripTypeIcon } from "@/components/trips/TripTypeIcon";
import { extractFlightInfo, parsePassengers } from "@/components/trips/utils";
import { MessagesTab } from "@/components/trips/tabs/MessagesTab";
import { AssignmentsTab } from "@/components/trips/tabs/AssignmentsTab";

interface TripDetailViewProps {
  viewTrip: DisplayTrip;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: TripMessage[];
  assignments: TripAssignment[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function TripDetailView({ 
  viewTrip,
  activeTab,
  setActiveTab,
  messages,
  assignments,
  newMessage,
  setNewMessage,
  handleSendMessage,
  setTripToAssign,
  setAssignOpen,
  setTripToMessage,
  setMessageOpen,
  setEditTrip,
  setTripToDelete,
  setDeleteDialogOpen
}: TripDetailViewProps) {
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
  };
  
  const formatStatus = (status: TripStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatTripType = (type: string): string => {
    return type.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const getStatusColor = (status: TripStatus): string => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderPassengers = () => {
    if (viewTrip.client_type !== "organization") return null;
    
    const passengers = parsePassengers(viewTrip.notes);
    if (passengers.length === 0) return null;
    
    return (
      <div className="border rounded-md p-4 space-y-2 mt-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Passengers ({passengers.length})</h3>
        </div>
        <div className="grid gap-1">
          {passengers.map((passenger, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                {passenger.charAt(0).toUpperCase()}
              </div>
              <span>{passenger}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trip ID</p>
                <p>{viewTrip.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusColor(viewTrip.status)}>
                  {formatStatus(viewTrip.status)}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service Type</p>
              <div className="flex items-center gap-1 mt-1">
                <TripTypeIcon type={viewTrip.type} className="h-4 w-4" />
                <p>{formatTripType(viewTrip.type)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
              <p>{formatDate(viewTrip.date)}</p>
              <p className="text-sm">{formatTime(viewTrip.time || viewTrip.start_time)}</p>
              {viewTrip.return_time && (
                <div className="mt-1">
                  <p className="text-sm font-medium text-muted-foreground">Return Time</p>
                  <p className="text-sm">{formatTime(viewTrip.return_time)}</p>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Route</p>
              {viewTrip.pickup_location && (
                <div className="flex items-start gap-1 mt-1">
                  <MapPin className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                  <p>{viewTrip.pickup_location}</p>
                </div>
              )}
              {viewTrip.dropoff_location && (
                <div className="flex items-start gap-1 mt-1">
                  <ArrowRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                  <p>{viewTrip.dropoff_location}</p>
                </div>
              )}
            </div>
            
            {(viewTrip.type === "airport_pickup" || viewTrip.type === "airport_dropoff") && 
              extractFlightInfo(viewTrip.notes) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flight Details</p>
                <p>{extractFlightInfo(viewTrip.notes)}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Name</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{viewTrip.client_name}</p>
                  {viewTrip.client_type === "organization" && (
                    <Badge variant="outline" className="text-xs">Organization</Badge>
                  )}
                </div>
              </div>
              
              {renderPassengers()}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p>${viewTrip.amount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Driver & Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {viewTrip.driver_avatar ? (
                    <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {viewTrip.driver_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{viewTrip.driver_name}</p>
                  {viewTrip.driver_contact && (
                    <p className="text-sm text-muted-foreground">{viewTrip.driver_contact}</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vehicle</p>
                <p>{viewTrip.vehicle_details}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {viewTrip.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{viewTrip.special_notes || viewTrip.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <MessagesTab 
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
    />
  );

  const renderAssignmentsTab = () => (
    <AssignmentsTab 
      assignments={assignments}
      setTripToAssign={setTripToAssign}
      setAssignOpen={setAssignOpen}
    />
  );

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Trip Details - {viewTrip.id.substring(0, 8).toUpperCase()}
        </h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <User className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          {renderDetailsTab()}
        </TabsContent>
        <TabsContent value="messages" className="space-y-4">
          {renderMessagesTab()}
        </TabsContent>
        <TabsContent value="assignments" className="space-y-4">
          {renderAssignmentsTab()}
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => setEditTrip(viewTrip)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Trip
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            setTripToDelete(viewTrip.id);
            setDeleteDialogOpen(true);
          }}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Trip
        </Button>
        <DialogClose asChild>
          <Button variant="secondary">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}
