
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Calendar,
  Car,
  User,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  FileText,
  Send,
  Clock,
  Check,
  X,
  Trash,
} from "lucide-react";
import {
  TripStatus,
  TripType,
  Trip,
  DisplayTrip,
  Driver,
  Vehicle,
  Client,
  TripMessage,
  TripAssignment,
} from "@/lib/types";
import { TripMessageData, TripAssignmentData } from "@/components/trips/types";

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
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip) => ({
        ...trip,
        client_name: trip.clients?.name || "Unknown Client",
        vehicle_details: `${trip.vehicles?.make} ${trip.vehicles?.model} (${trip.vehicles?.registration})`,
        driver_name: trip.drivers?.name || "Unknown Driver",
        driver_avatar: trip.drivers?.avatar_url,
        driver_contact: trip.drivers?.contact,
      })) as DisplayTrip[];
    },
  });

  // Fetch trip messages
  const { data: messages } = useQuery({
    queryKey: ["tripMessages", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the messages
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", viewTrip.id)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data as TripMessageData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch trip assignments
  const { data: assignments } = useQuery({
    queryKey: ["tripAssignments", viewTrip?.id],
    queryFn: async () => {
      if (!viewTrip) return [];
      
      // Use a raw query to get the assignments with driver details
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(`
          *,
          drivers:driver_id(name, avatar_url)
        `)
        .eq("trip_id", viewTrip.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.drivers?.name,
        driver_avatar: assignment.drivers?.avatar_url
      })) as TripAssignmentData[];
    },
    enabled: !!viewTrip,
  });

  // Fetch clients, vehicles, and drivers for forms
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
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

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("trips-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trips" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to messages changes
  useEffect(() => {
    if (!viewTrip) return;
    
    const channel = supabase
      .channel("trip-messages-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${viewTrip.id}` }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["tripMessages", viewTrip.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, viewTrip]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messages?.length && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      
      // Update local viewTrip state if it's the current trip
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

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setDeleteDialogOpen(false);
      setTripToDelete(null);
      
      // Close any open dialogs if they were showing the deleted trip
      if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
      if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
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
    
    const tripData = {
      client_id: formData.get("client_id") as string,
      vehicle_id: formData.get("vehicle_id") as string,
      driver_id: formData.get("driver_id") as string,
      date: formData.get("date") as string,
      type: formData.get("type") as TripType,
      status: formData.get("status") as TripStatus,
      amount: parseFloat(formData.get("amount") as string) || 0,
      pickup_location: formData.get("pickup_location") as string || null,
      dropoff_location: formData.get("dropoff_location") as string || null,
      start_time: formData.get("start_time") as string || null,
      end_time: formData.get("end_time") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      if (editTrip) {
        // Update existing trip
        const { error } = await supabase
          .from("trips")
          .update(tripData)
          .eq("id", editTrip.id);
        
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "Trip details have been updated successfully",
        });
        
        setEditTrip(null);
      } else {
        // Create new trip
        const { error } = await supabase
          .from("trips")
          .insert(tripData);
        
        if (error) throw error;

        toast({
          title: "Trip created",
          description: "New trip has been booked successfully",
        });
        
        setBookingOpen(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
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
      // Create assignment record using the rpc endpoint
      const { error: assignError } = await supabase.rpc('insert_trip_assignment', {
        p_trip_id: tripToAssign.id,
        p_driver_id: assignDriver,
        p_status: "pending",
        p_notes: assignNote || null
      });
      
      if (assignError) {
        // Fallback to direct insertion if RPC isn't available
        console.log("Falling back to direct insert");
        const { error } = await supabase.from('trip_assignments').insert({
          trip_id: tripToAssign.id,
          driver_id: assignDriver,
          assigned_at: new Date().toISOString(),
          status: "pending",
          notes: assignNote || null
        });
        
        if (error) throw error;
      }
      
      // Update trip with new driver
      const { error: updateError } = await supabase
        .from("trips")
        .update({ driver_id: assignDriver })
        .eq("id", tripToAssign.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip",
      });
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["tripAssignments", tripToAssign.id] });
      
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
      // Send message using the rpc endpoint
      const { error: rpcError } = await supabase.rpc('insert_trip_message', {
        p_trip_id: tripToMessage.id,
        p_sender_type: "admin",
        p_sender_name: "Fleet Manager",
        p_message: newMessage.trim(),
        p_is_read: false
      });
      
      if (rpcError) {
        // Fallback to direct insertion if RPC isn't available
        console.log("Falling back to direct insert for message");
        const { error } = await supabase.from('trip_messages').insert({
          trip_id: tripToMessage.id,
          sender_type: "admin",
          sender_name: "Fleet Manager", // In a real app, use the current user's name
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          is_read: false
        });
        
        if (error) throw error;
      }
      
      toast({
        title: "Message sent",
        description: "Your message has been sent",
      });
      
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["tripMessages", tripToMessage.id] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Helper functions for formatting
  const formatStatus = (status: TripStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatTripType = (type: TripType): string => {
    return type.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const formatTime = (timeStr: string): string => {
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

  // Format trip ID to show first 8 characters
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
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
        <Button onClick={() => setBookingOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Book Trip
        </Button>
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

      {/* Trips Table */}
      {!filteredTrips || filteredTrips.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Trips Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "No trips match your search criteria"
              : "Schedule a new trip to get started"}
          </p>
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Book Trip
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewTrip(trip)}>
                  <TableCell>{formatTripId(trip.id)}</TableCell>
                  <TableCell>{formatDate(trip.date)}</TableCell>
                  <TableCell>{trip.client_name}</TableCell>
                  <TableCell>{trip.vehicle_details}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {trip.driver_avatar ? (
                          <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
                        ) : (
                          <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      {trip.driver_name}
                    </div>
                  </TableCell>
                  <TableCell>{formatTripType(trip.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(trip.status)}>
                      {formatStatus(trip.status)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewTrip(trip)}>
                          <FileText className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTrip(trip)}>
                          <FileText className="mr-2 h-4 w-4" /> Edit Trip
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setTripToAssign(trip);
                          setAssignOpen(true);
                        }}>
                          <User className="mr-2 h-4 w-4" /> Assign Driver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setTripToMessage(trip);
                          setMessageOpen(true);
                        }}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Send Message
                        </DropdownMenuItem>
                        
                        {trip.status !== "completed" && trip.status !== "cancelled" && (
                          <>
                            <DropdownMenuSeparator />
                            {trip.status !== "in_progress" && (
                              <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "in_progress")}>
                                <Clock className="mr-2 h-4 w-4" /> Mark as In Progress
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "completed")}>
                              <Check className="mr-2 h-4 w-4" /> Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateTripStatus(trip.id, "cancelled")}>
                              <X className="mr-2 h-4 w-4" /> Mark as Cancelled
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setTripToDelete(trip.id);
                          setDeleteDialogOpen(true);
                        }}>
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Trip Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={(open) => !open && setViewTrip(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Trip #{viewTrip && formatTripId(viewTrip.id)}</DialogTitle>
              {viewTrip && (
                <Badge variant="outline" className={getStatusColor(viewTrip.status)}>
                  {formatStatus(viewTrip.status)}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {viewTrip && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="assignments">Driver Assignments</TabsTrigger>
              </TabsList>
              
              {/* Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-auto p-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Client</CardTitle>
                      </CardHeader>
                      <CardContent>{viewTrip.client_name}</CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Driver</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {viewTrip.driver_avatar ? (
                              <AvatarImage src={viewTrip.driver_avatar} alt={viewTrip.driver_name} />
                            ) : (
                              <AvatarFallback>{viewTrip.driver_name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{viewTrip.driver_name}</p>
                            {viewTrip.driver_contact && (
                              <p className="text-sm text-muted-foreground">{viewTrip.driver_contact}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setTripToAssign(viewTrip);
                            setAssignOpen(true);
                          }}
                        >
                          <User className="mr-2 h-4 w-4" /> Change Driver
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Trip Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span>{formatDate(viewTrip.date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{formatTripType(viewTrip.type)}</span>
                          </div>
                          {viewTrip.start_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Start Time:</span>
                              <span>{formatTime(viewTrip.start_time)}</span>
                            </div>
                          )}
                          {viewTrip.end_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">End Time:</span>
                              <span>{formatTime(viewTrip.end_time)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span>{formatCurrency(viewTrip.amount)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Vehicle</CardTitle>
                      </CardHeader>
                      <CardContent>{viewTrip.vehicle_details}</CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {viewTrip.pickup_location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Pickup Location</p>
                              <p className="text-muted-foreground">{viewTrip.pickup_location}</p>
                            </div>
                          </div>
                        )}
                        
                        {viewTrip.dropoff_location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Dropoff Location</p>
                              <p className="text-muted-foreground">{viewTrip.dropoff_location}</p>
                            </div>
                          </div>
                        )}
                        
                        {!viewTrip.pickup_location && !viewTrip.dropoff_location && (
                          <p className="text-muted-foreground">No location details provided</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {viewTrip.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{viewTrip.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              {/* Messages Tab */}
              <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  {!messages || messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Messages</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start a conversation with the driver or client
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-1">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender_type === "admin" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{msg.sender_name}</span>
                              <span className="text-xs opacity-70">
                                {format(new Date(msg.timestamp), "h:mm a")}
                              </span>
                            </div>
                            <p>{msg.message}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                <div className="border-t mt-4 pt-4">
                  <div className="flex gap-2">
                    <Input 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder="Type your message..." 
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          setTripToMessage(viewTrip);
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        setTripToMessage(viewTrip);
                        handleSendMessage();
                      }} 
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {/* Assignments Tab */}
              <TabsContent value="assignments" className="flex-1 overflow-auto p-1">
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setTripToAssign(viewTrip);
                      setAssignOpen(true);
                    }} 
                    className="mb-4"
                  >
                    <User className="mr-2 h-4 w-4" /> Assign New Driver
                  </Button>
                  
                  {!assignments || assignments.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg">
                      <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Assignment History</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This trip has no driver assignment history
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <Card key={assignment.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {assignment.driver_avatar ? (
                                  <AvatarImage src={assignment.driver_avatar} alt={assignment.driver_name} />
                                ) : (
                                  <AvatarFallback>{assignment.driver_name?.charAt(0) || "D"}</AvatarFallback>
                                )}
                              </Avatar>
                              {assignment.driver_name}
                              <Badge variant="outline" className={`ml-auto ${
                                assignment.status === "accepted" 
                                  ? "bg-green-100 text-green-700" 
                                  : assignment.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Assigned on {formatDateTime(assignment.assigned_at)}
                            </p>
                          </CardHeader>
                          {assignment.notes && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-4 border-t pt-4">
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={() => viewTrip && setEditTrip(viewTrip)}
              >
                Edit Trip
              </Button>
              <div className="space-x-2">
                {viewTrip && viewTrip.status === "scheduled" && (
                  <Button onClick={() => updateTripStatus(viewTrip.id, "in_progress")}>
                    Mark as In Progress
                  </Button>
                )}
                {viewTrip && viewTrip.status === "in_progress" && (
                  <Button onClick={() => updateTripStatus(viewTrip.id, "completed")}>
                    Mark as Completed
                  </Button>
                )}
                {viewTrip && (viewTrip.status === "scheduled" || viewTrip.status === "in_progress") && (
                  <Button variant="destructive" onClick={() => updateTripStatus(viewTrip.id, "cancelled")}>
                    Cancel Trip
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book/Edit Trip Form Dialog */}
      <Dialog 
        open={bookingOpen || !!editTrip} 
        onOpenChange={(open) => {
          if (!open) {
            setBookingOpen(false);
            setEditTrip(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editTrip ? "Edit Trip" : "Book New Trip"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveTrip}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select name="client_id" defaultValue={editTrip?.client_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input 
                  type="date" 
                  id="date"
                  name="date" 
                  defaultValue={editTrip?.date || new Date().toISOString().split("T")[0]} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input 
                  type="time" 
                  id="start_time"
                  name="start_time" 
                  defaultValue={editTrip?.start_time || ""} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input 
                  type="time" 
                  id="end_time"
                  name="end_time" 
                  defaultValue={editTrip?.end_time || ""} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle *</Label>
                <Select name="vehicle_id" defaultValue={editTrip?.vehicle_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver *</Label>
                <Select name="driver_id" defaultValue={editTrip?.driver_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Trip Type *</Label>
                <Select name="type" defaultValue={editTrip?.type || "airport_pickup"} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="multi_day">Multi Day</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editTrip?.status || "scheduled"} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input 
                  type="number" 
                  id="amount"
                  name="amount" 
                  defaultValue={editTrip?.amount || 0} 
                  min="0" 
                  step="0.01" 
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 my-4">
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input 
                id="pickup_location"
                name="pickup_location" 
                defaultValue={editTrip?.pickup_location || ""} 
                placeholder="Enter pickup location"
              />
            </div>
            
            <div className="space-y-2 my-4">
              <Label htmlFor="dropoff_location">Dropoff Location</Label>
              <Input 
                id="dropoff_location"
                name="dropoff_location" 
                defaultValue={editTrip?.dropoff_location || ""} 
                placeholder="Enter dropoff location"
              />
            </div>
            
            <div className="space-y-2 my-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                name="notes" 
                defaultValue={editTrip?.notes || ""} 
                placeholder="Additional information about the trip"
                rows={3}
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="submit">{editTrip ? "Save Changes" : "Book Trip"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog 
        open={assignOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setAssignOpen(false);
            setTripToAssign(null);
            setAssignDriver("");
            setAssignNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              {tripToAssign && (
                <span>
                  Trip #{formatTripId(tripToAssign.id)} on {formatDate(tripToAssign.date)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="driver_id">Select Driver</Label>
              <Select 
                value={assignDriver} 
                onValueChange={setAssignDriver}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {driver.avatar_url ? (
                            <AvatarImage src={driver.avatar_url} alt={driver.name} />
                          ) : (
                            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        {driver.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignment_note">Note (Optional)</Label>
              <Textarea 
                id="assignment_note"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Add any notes for the driver assignment"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleAssignDriver}
              disabled={!assignDriver}
            >
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog 
        open={messageOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setMessageOpen(false);
            setTripToMessage(null);
            setNewMessage("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              {tripToMessage && (
                <div className="mt-2 space-y-1">
                  <p>Trip #{formatTripId(tripToMessage.id)}</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Driver: {tripToMessage.driver_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {formatDate(tripToMessage.date)}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setTripToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteTrip}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
