
import React, { useRef } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";

// Helper function to parse flight details from notes
const parseFlightDetails = (notes?: string) => {
  if (!notes) return { flight: null, airline: null, terminal: null };
  
  const flightMatch = notes.match(/Flight: ([^\n]+)/);
  const airlineMatch = notes.match(/Airline: ([^\n]+)/);
  const terminalMatch = notes.match(/Terminal: ([^\n]+)/);
  
  return {
    flight: flightMatch ? flightMatch[1].trim() : null,
    airline: airlineMatch ? airlineMatch[1].trim() : null,
    terminal: terminalMatch ? terminalMatch[1].trim() : null
  };
};

// Helper function to parse passengers from notes
const parsePassengers = (notes?: string): string[] => {
  if (!notes) return [];
  
  const passengersMatch = notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1].split('\n').filter(p => p.trim());
  }
  
  return [];
};

interface TripDetailsDialogProps {
  viewTrip: DisplayTrip | null;
  setViewTrip: React.Dispatch<React.SetStateAction<DisplayTrip | null>>;
  setEditTrip: React.Dispatch<React.SetStateAction<DisplayTrip | null>>;
  setTripToMessage: React.Dispatch<React.SetStateAction<DisplayTrip | null>>;
  setMessageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  formatDate: (dateStr: string) => string;
  formatTime: (timeStr?: string) => string;
  formatDateTime: (dateTimeStr: string) => string;
  formatStatus: (status: TripStatus) => string;
  getStatusColor: (status: TripStatus) => string;
  messages: any[] | undefined;
  assignments: any[] | undefined;
}

const TripDetailsDialog: React.FC<TripDetailsDialogProps> = ({
  viewTrip,
  setViewTrip,
  setEditTrip,
  setTripToMessage,
  setMessageOpen,
  activeTab,
  setActiveTab,
  formatDate,
  formatTime,
  formatDateTime,
  formatStatus,
  getStatusColor,
  messages,
  assignments,
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={viewTrip !== null} onOpenChange={(open) => !open && setViewTrip(null)}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center gap-2">
            {viewTrip && (
              <>
                <div className="p-2 rounded-full bg-blue-100">
                  {/* This would normally be getTripTypeIcon but we'll simplify here */}
                </div>
                {viewTrip.ui_service_type || viewTrip.type}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Trip ID: {viewTrip ? viewTrip.id.substring(0, 8).toUpperCase() : ""}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pb-6">
            {viewTrip && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{viewTrip.client_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{viewTrip.client_name}</div>
                          <div className="text-sm text-gray-500">{viewTrip.client_type || "Individual"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Driver Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={viewTrip.driver_avatar || ""} />
                          <AvatarFallback>{viewTrip.driver_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{viewTrip.driver_name}</div>
                          {viewTrip.driver_contact && (
                            <div className="text-sm text-gray-500">{viewTrip.driver_contact}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Date</div>
                        <div>{formatDate(viewTrip.date)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Time</div>
                        <div>
                          {formatTime(viewTrip.start_time)}
                          {viewTrip.end_time && ` - ${formatTime(viewTrip.end_time)}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Status</div>
                        <Badge className={`${getStatusColor(viewTrip.status)}`}>
                          {formatStatus(viewTrip.status)}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Vehicle</div>
                        <div>{viewTrip.vehicle_details}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Pickup Location</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{viewTrip.pickup_location || "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Dropoff Location</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{viewTrip.dropoff_location || "Not specified"}</span>
                      </div>
                    </div>
                    
                    {(viewTrip.ui_service_type === "airport_pickup" || viewTrip.ui_service_type === "airport_dropoff") && (
                      <div className="space-y-4">
                        <div className="text-sm font-medium">Flight Information</div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Flight Number</div>
                            <div>{viewTrip.flight_number || parseFlightDetails(viewTrip.notes).flight || "Not specified"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Airline</div>
                            <div>{viewTrip.airline || parseFlightDetails(viewTrip.notes).airline || "Not specified"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Terminal</div>
                            <div>{viewTrip.terminal || parseFlightDetails(viewTrip.notes).terminal || "Not specified"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Check if there are passengers in the notes */}
                    {viewTrip.client_type === "organization" && parsePassengers(viewTrip.notes).length > 0 && (
                      <div>
                        <div className="text-sm font-medium">Passengers</div>
                        <ul className="list-disc pl-5 mt-1">
                          {parsePassengers(viewTrip.notes).map((passenger, index) => (
                            <li key={index}>{passenger}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm font-medium">Notes</div>
                      <div className="text-gray-600 whitespace-pre-wrap">
                        {viewTrip.notes || "No additional notes"}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setViewTrip(null)}>
                      Close
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditTrip(viewTrip);
                          setViewTrip(null);
                        }}
                      >
                        Edit Trip
                      </Button>
                      <Button 
                        onClick={() => {
                          setTripToMessage(viewTrip);
                          setMessageOpen(true);
                          setViewTrip(null);
                        }}
                      >
                        Send Message
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="pb-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trip Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[380px] px-6 py-4">
                  {messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_type === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.sender_type === "admin"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div className="text-xs font-medium mb-1">
                              {msg.sender_name} ({formatDateTime(msg.timestamp)})
                            </div>
                            <div className="whitespace-pre-wrap">{msg.message}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No messages for this trip yet.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 flex items-center gap-2 border-t">
                <Button 
                  className="h-10 w-10 p-2 rounded-full" 
                  variant="ghost"
                  onClick={() => {
                    setTripToMessage(viewTrip);
                    setMessageOpen(true);
                    setViewTrip(null);
                  }}
                >
                  <span className="plus-icon">+</span>
                </Button>
                <span className="text-gray-500">
                  Click to add a new message
                </span>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="pb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assignment History</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments && assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={assignment.driver_avatar || ""} />
                            <AvatarFallback>
                              {assignment.driver_name ? assignment.driver_name.charAt(0) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{assignment.driver_name || "Unknown Driver"}</div>
                            <div className="text-xs text-gray-500">
                              Assigned on {formatDateTime(assignment.assigned_at)}
                            </div>
                          </div>
                          <Badge 
                            className={
                              assignment.status === "accepted" ? "bg-green-100 text-green-800" : 
                              assignment.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </Badge>
                        </div>
                        {assignment.notes && (
                          <div className="ml-11 text-sm text-gray-600">
                            <div className="font-medium text-xs text-gray-500">Notes:</div>
                            <div>{assignment.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No assignment history for this trip.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TripDetailsDialog;
