
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  FileText, 
  MoreHorizontal, 
  Trash,
  Map,
  Calendar,
  Clock,
  User,
  Truck
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DisplayTrip, TripStatus, TripType, Client, Driver, Vehicle } from "@/lib/types";

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tripToDelete, setTripToDelete] = useState<DisplayTrip | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [bookTripDialogOpen, setBookTripDialogOpen] = useState(false);

  // Get trips
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          clients:client_id(name, email),
          vehicles:vehicle_id(make, model, registration, type),
          drivers:driver_id(name, contact)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;

      // Map the data to match our Trip interface
      return data.map(trip => ({
        id: trip.id,
        date: trip.date,
        start_time: trip.start_time,
        end_time: trip.end_time,
        client_id: trip.client_id,
        client_name: trip.clients?.name || 'Unknown Client',
        vehicle_id: trip.vehicle_id,
        vehicle_details: `${trip.vehicles?.make} ${trip.vehicles?.model} (${trip.vehicles?.registration})`,
        driver_id: trip.driver_id,
        driver_name: trip.drivers?.name || 'Unknown Driver',
        pickup_location: trip.pickup_location,
        dropoff_location: trip.dropoff_location,
        type: trip.type as TripType,
        status: trip.status as TripStatus,
        notes: trip.notes,
        amount: trip.amount,
        invoice_id: trip.invoice_id,
        created_at: trip.created_at,
        updated_at: trip.updated_at
      })) as DisplayTrip[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trips' }, 
        () => {
          // Force refresh the trips data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get clients for the form
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Get vehicles for the form
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, registration, type')
        .eq('status', 'active')
        .order('make');
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  // Get drivers for the form
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data as Driver[];
    },
  });

  const handleViewTrip = (trip: DisplayTrip) => {
    setViewTrip(trip);
  };

  const handleEditTrip = (trip: DisplayTrip) => {
    setEditTrip(trip);
  };

  const handleViewDialogClose = (open: boolean) => {
    if (!open) {
      setViewTrip(null);
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setEditTrip(null);
    }
  };

  const handleDeleteClick = (trip: DisplayTrip) => {
    setTripToDelete(trip);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;
    
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Trip deleted",
        description: "The trip has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete the trip.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setTripToDelete(null);
    }
  };

  const handleUpdateStatus = async (trip: DisplayTrip, status: TripStatus) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status })
        .eq('id', trip.id);
        
      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status has been updated to ${status.replace("_", " ")}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setViewTrip(null);
    } catch (error) {
      console.error("Error updating trip:", error);
      toast({
        title: "Error",
        description: "Failed to update the trip.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTrip = async (trip: DisplayTrip | null, formData: FormData) => {
    try {
      const clientId = formData.get('client_id') as string;
      const vehicleId = formData.get('vehicle_id') as string;
      const driverId = formData.get('driver_id') as string;
      const date = formData.get('date') as string;
      const startTime = formData.get('start_time') as string || null;
      const endTime = formData.get('end_time') as string || null;
      const pickupLocation = formData.get('pickup_location') as string || null;
      const dropoffLocation = formData.get('dropoff_location') as string || null;
      const type = formData.get('type') as TripType;
      const status = formData.get('status') as TripStatus;
      const amount = parseFloat(formData.get('amount') as string) || 0;
      const notes = formData.get('notes') as string || null;

      const tripData = {
        client_id: clientId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        date,
        start_time: startTime,
        end_time: endTime,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        type,
        status,
        amount,
        notes
      };

      if (trip) {
        // Update existing trip
        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', trip.id);
          
        if (error) throw error;

        toast({
          title: "Trip updated",
          description: "The trip has been updated successfully.",
        });
      } else {
        // Create new trip
        const { error } = await supabase
          .from('trips')
          .insert(tripData);
          
        if (error) throw error;

        toast({
          title: "Trip booked",
          description: "The trip has been booked successfully.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setEditTrip(null);
      setBookTripDialogOpen(false);
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: "Failed to save the trip.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTripType = (type: TripType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format the ID to show only the short version
  const formatId = (id: string) => {
    // Return just the first 8 characters of the UUID
    return id.substring(0, 8).toUpperCase();
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Only filter trips if we have data and a search term/status filter
  const filteredTrips = trips 
    ? trips.filter(trip => {
        const matchesSearch = !searchTerm || 
          trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.vehicle_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

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
          <p className="text-muted-foreground">Manage trip reservations</p>
        </div>
        <Button onClick={() => setBookTripDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Book Trip
        </Button>
      </div>

      <div className="flex justify-between gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
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

      {!filteredTrips || filteredTrips.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <Map className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Trips Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? "No trips match your search criteria" 
              : "Schedule a new trip to get started"}
          </p>
          <Button onClick={() => setBookTripDialogOpen(true)}>
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
                <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTrip(trip)}>
                  <TableCell>{formatId(trip.id)}</TableCell>
                  <TableCell>{format(new Date(trip.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{trip.client_name}</TableCell>
                  <TableCell>{trip.vehicle_details}</TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  <TableCell>{formatTripType(trip.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(trip.status)}`}>
                      {trip.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
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
                        <DropdownMenuItem onClick={() => handleViewTrip(trip)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTrip(trip)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(trip, 'in_progress')}>
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(trip, 'completed')}>
                              <Map className="mr-2 h-4 w-4" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(trip, 'cancelled')}>
                              <Trash className="mr-2 h-4 w-4" />
                              Mark as Cancelled
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(trip)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
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

      {/* Trip Details Dialog */}
      <Dialog open={!!viewTrip} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Trip Details</DialogTitle>
          {viewTrip && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold">#{formatId(viewTrip.id)}</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(viewTrip.date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(viewTrip.status)}`}>
                  {viewTrip.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold">Client</h4>
                    <p className="text-lg">{viewTrip.client_name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold">Trip Type</h4>
                    <p className="text-lg">{formatTripType(viewTrip.type)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold">Amount</h4>
                    <p className="text-lg">{formatCurrency(viewTrip.amount)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold">Vehicle</h4>
                    <p className="text-lg">{viewTrip.vehicle_details}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold">Driver</h4>
                    <p className="text-lg">{viewTrip.driver_name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold">Time</h4>
                    <p className="text-lg">
                      {viewTrip.start_time ? format(new Date(`2000-01-01T${viewTrip.start_time}`), 'h:mm a') : 'N/A'}
                      {viewTrip.end_time ? ` - ${format(new Date(`2000-01-01T${viewTrip.end_time}`), 'h:mm a')}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {(viewTrip.pickup_location || viewTrip.dropoff_location) && (
                <div className="space-y-2">
                  {viewTrip.pickup_location && (
                    <div>
                      <h4 className="text-sm font-semibold">Pickup Location</h4>
                      <p className="text-muted-foreground">{viewTrip.pickup_location}</p>
                    </div>
                  )}
                  
                  {viewTrip.dropoff_location && (
                    <div>
                      <h4 className="text-sm font-semibold">Dropoff Location</h4>
                      <p className="text-muted-foreground">{viewTrip.dropoff_location}</p>
                    </div>
                  )}
                </div>
              )}
              
              {viewTrip.notes && (
                <div>
                  <h4 className="text-sm font-semibold">Notes</h4>
                  <p className="text-muted-foreground">{viewTrip.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewTrip(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleEditTrip(viewTrip)}>
                  Edit
                </Button>
                {viewTrip.status === 'scheduled' && (
                  <Button onClick={() => handleUpdateStatus(viewTrip, 'in_progress')}>
                    Mark as In Progress
                  </Button>
                )}
                {viewTrip.status === 'in_progress' && (
                  <Button onClick={() => handleUpdateStatus(viewTrip, 'completed')}>
                    Mark as Completed
                  </Button>
                )}
                {(viewTrip.status === 'scheduled' || viewTrip.status === 'in_progress') && (
                  <Button variant="destructive" onClick={() => handleUpdateStatus(viewTrip, 'cancelled')}>
                    Cancel Trip
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={!!editTrip} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Edit Trip</DialogTitle>
          {editTrip && (
            <TripForm 
              trip={editTrip} 
              onSave={handleSaveTrip}
              clients={clients || []}
              vehicles={vehicles || []}
              drivers={drivers || []}
              onCancel={() => setEditTrip(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Book Trip Dialog */}
      <Dialog open={bookTripDialogOpen} onOpenChange={setBookTripDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Book New Trip</DialogTitle>
          <TripForm 
            trip={null} 
            onSave={handleSaveTrip}
            clients={clients || []}
            vehicles={vehicles || []}
            drivers={drivers || []}
            onCancel={() => setBookTripDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm deletion dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TripFormProps {
  trip: DisplayTrip | null;
  onSave: (trip: DisplayTrip | null, formData: FormData) => void;
  onCancel: () => void;
  clients: Client[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

function TripForm({ trip, onSave, onCancel, clients, vehicles, drivers }: TripFormProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave(trip, new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select name="client_id" defaultValue={trip?.client_id} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
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
              name="date" 
              defaultValue={trip?.date || today} 
              min={today}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehicle *</Label>
            <Select name="vehicle_id" defaultValue={trip?.vehicle_id} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.registration})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="driver_id">Driver *</Label>
            <Select name="driver_id" defaultValue={trip?.driver_id} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Input 
              type="time" 
              name="start_time" 
              defaultValue={trip?.start_time || ""} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input 
              type="time" 
              name="end_time" 
              defaultValue={trip?.end_time || ""} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Trip Type *</Label>
            <Select name="type" defaultValue={trip?.type || "airport_pickup"} required>
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
            <Select name="status" defaultValue={trip?.status || "scheduled"} required>
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location</Label>
            <Input 
              name="pickup_location" 
              defaultValue={trip?.pickup_location || ""} 
              placeholder="Enter pickup location"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dropoff_location">Dropoff Location</Label>
            <Input 
              name="dropoff_location" 
              defaultValue={trip?.dropoff_location || ""} 
              placeholder="Enter dropoff location"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD) *</Label>
          <Input 
            type="number" 
            name="amount" 
            defaultValue={trip?.amount || 0} 
            min="0" 
            step="0.01" 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            name="notes" 
            defaultValue={trip?.notes || ""} 
            placeholder="Any additional information about the trip"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {trip ? 'Save Changes' : 'Book Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}
