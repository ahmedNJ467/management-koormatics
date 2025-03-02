
import { useRef } from "react";
import { format } from "date-fns";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { User, MessageCircle, MapPin, ArrowRight, Send } from "lucide-react";
import { DisplayTrip, TripStatus, TripType } from "@/lib/types/trip";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";
import { parseFlightDetails, parsePassengers } from "@/components/trips/utils";
import { TripTypeIcon } from "./TripTypeIcon";

interface TripDetailViewProps {
  viewTrip: DisplayTrip;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages?: TripMessageData[];
  assignments?: TripAssignmentData[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Format functions
  const formatStatus = (status: TripStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatTripType = (type: TripType, trip?: DisplayTrip): string => {
    if (trip?.ui_service_type) {
      // Custom labels for UI service types
      const labels: Record<string, string> = {
        "airport_pickup": "Airport Pickup",
        "airport_dropoff": "Airport Dropoff",
        "round_trip": "Round Trip",
        "security_escort": "Security Escort",
        "one_way": "One Way Transfer",
        "full_day_hire": "Full Day Hire"
      };
      
      if (trip.ui_service_type in labels) {
        return labels[trip.ui_service_type];
      }
    }
    
    // Fallback
    return type.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };
  
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
  };
  
  const formatDateTime = (dateTimeStr: string): string => {
    return format(new Date(dateTimeStr), "MMM d, yyyy h:mm a");
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

  return (
    <>
      <DialogHeader>
        <div className="flex justify-between items-start">
          <div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <TripTypeIcon type={viewTrip.type} />
              {formatTripType(viewTrip.type, viewTrip)}
            </DialogTitle>
            <DialogDescription>
              Trip ID: {formatTripId(viewTrip.id)}
            </DialogDescription>
          </div>
          <Badge className={getStatusColor(viewTrip.status)}>
            {formatStatus(viewTrip.status)}
          </Badge>
        </div>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">
            Assignment History
          </TabsTrigger>
          <TabsTrigger value="messages">
            Messages {messages?.length ? `(${messages.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="max-h-[calc(90vh-160px)]">
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Date & Time</h3>
                <p className="text-sm">{formatDate(viewTrip.date)} at {formatTime(viewTrip.time)}</p>
                {viewTrip.return_time && (
                  <p className="text-sm text-muted-foreground">Return: {formatTime(viewTrip.return_time)}</p>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Client</h3>
                <p className="text-sm flex items-center gap-1">
                  {viewTrip.client_name}
                  {viewTrip.client_type === "organization" && (
                    <Badge variant="outline" className="text-xs">Organization</Badge>
                  )}
                </p>
              </div>
            </div>

            {/* Display passengers list if client is organization */}
            {viewTrip.client_type === "organization" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Passengers</h3>
                <div className="text-sm space-y-1">
                  {parsePassengers(viewTrip.notes).length > 0 ? 
                    parsePassengers(viewTrip.notes).map((passenger, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{passenger}</span>
                      </div>
                    )) : 
                    <p className="text-muted-foreground">No passengers listed</p>
                  }
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Route</h3>
              {viewTrip.pickup_location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Pickup</div>
                    <div>{viewTrip.pickup_location}</div>
                  </div>
                </div>
              )}
              {viewTrip.dropoff_location && (
                <div className="flex items-start gap-2 text-sm mt-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Dropoff</div>
                    <div>{viewTrip.dropoff_location}</div>
                  </div>
                </div>
              )}
            </div>

            {(viewTrip.type === "airport_pickup" || viewTrip.type === "airport_dropoff") && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Flight Details</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="font-medium">Flight</div>
                    <div>{parseFlightDetails(viewTrip.notes).flight || "N/A"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Airline</div>
                    <div>{parseFlightDetails(viewTrip.notes).airline || "N/A"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Terminal</div>
                    <div>{parseFlightDetails(viewTrip.notes).terminal || "N/A"}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Driver & Vehicle</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {viewTrip.driver_avatar ? (
                    <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {viewTrip.driver_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{viewTrip.driver_name}</div>
                  {viewTrip.driver_contact && (
                    <div className="text-xs text-muted-foreground">{viewTrip.driver_contact}</div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Vehicle:</span> {viewTrip.vehicle_details}
              </div>
            </div>

            {viewTrip.notes && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Notes</h3>
                <div className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                  {viewTrip.notes
                    // Remove flight details and passenger list from notes display 
                    // since we show them in their own sections
                    ?.replace(/Flight: .*\n?/g, '')
                    .replace(/Airline: .*\n?/g, '')
                    .replace(/Terminal: .*\n?/g, '')
                    .replace(/\n\nPassengers:\n.*$/s, '')
                    .trim()}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {assignments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No driver assignment history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments?.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {assignment.driver_avatar ? (
                              <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {assignment.driver_name?.charAt(0) || 'D'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{assignment.driver_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(assignment.assigned_at)}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={
                            assignment.status === "accepted" ? "bg-green-100 text-green-700" :
                            assignment.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </div>
                      {assignment.notes && (
                        <div className="text-sm mt-2 bg-muted p-3 rounded-md">
                          {assignment.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="border rounded-md p-3 h-[300px] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-3">
                {messages?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages?.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex flex-col ${
                          message.sender_type === "admin" ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {message.sender_name} ({message.sender_type}) - {formatDateTime(message.timestamp)}
                        </div>
                        <div 
                          className={`p-3 rounded-lg max-w-[80%] ${
                            message.sender_type === "admin" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}
                        >
                          {message.message}
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <DialogFooter className="gap-2 sm:gap-0">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setTripToAssign(viewTrip);
              setAssignOpen(true);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Assign Driver
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setTripToMessage(viewTrip);
              setMessageOpen(true);
            }}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setEditTrip(viewTrip)}
          >
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              setTripToDelete(viewTrip.id);
              setDeleteDialogOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
