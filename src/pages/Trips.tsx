
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DisplayTrip, ServiceType, TripStatus } from "@/lib/types/trip";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableCaption 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Trips = () => {
  const [trips, setTrips] = useState<DisplayTrip[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const rowsPerPage = 5;
  const { toast } = useToast();

  // Form states
  const [form, setForm] = useState<Omit<DisplayTrip, 'client_name' | 'vehicle_details' | 'driver_name' | 'driver_avatar' | 'driver_contact' | 'time' | 'return_time' | 'special_notes' | 'ui_service_type'>>({
    id: '',
    client_id: '',
    vehicle_id: '',
    driver_id: '',
    date: dayjs().format('YYYY-MM-DD'),
    start_time: '',
    end_time: '',
    service_type: 'airport_pickup',
    status: 'scheduled',
    amount: 0,
    pickup_location: '',
    dropoff_location: '',
    flight_number: '',
    airline: '',
    terminal: '',
    special_instructions: '',
    is_recurring: false,
    notes: '',
    invoice_id: '',
    created_at: '',
    updated_at: ''
  });
  
  const [editForm, setEditForm] = useState<DisplayTrip>({
    id: '',
    client_id: '',
    vehicle_id: '',
    driver_id: '',
    date: dayjs().format('YYYY-MM-DD'),
    start_time: '',
    end_time: '',
    service_type: 'airport_pickup',
    status: 'scheduled',
    amount: 0,
    pickup_location: '',
    dropoff_location: '',
    flight_number: '',
    airline: '',
    terminal: '',
    special_instructions: '',
    is_recurring: false,
    notes: '',
    invoice_id: '',
    created_at: '',
    updated_at: '',
    client_name: '',
    client_type: "individual",
    vehicle_details: '',
    driver_name: '',
    driver_avatar: '',
    driver_contact: '',
    time: '',
    return_time: '',
    special_notes: '',
    ui_service_type: ''
  });
  
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; details: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string; avatar_url?: string; contact?: string }[]>([]);

  useEffect(() => {
    fetchTrips();
    fetchClients();
    fetchVehicles();
    fetchDrivers();
  }, [page]);

  const fetchTrips = async () => {
    try {
      const { data, error, count } = await supabase
        .from('trips')
        .select('*, clients(name, type), vehicles(make, model), drivers(name, avatar_url, contact)', { count: 'exact' })
        .range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

      if (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }

      if (data) {
        const formattedTrips: DisplayTrip[] = data.map((trip: any) => ({
          ...trip,
          client_name: trip.clients?.name || 'Unknown Client',
          client_type: trip.clients?.type || 'individual',
          vehicle_details: trip.vehicles ? `${trip.vehicles.make} ${trip.vehicles.model}` : 'Unknown Vehicle',
          driver_name: trip.drivers?.name || 'Unknown Driver',
          driver_avatar: trip.drivers?.avatar_url || '',
          driver_contact: trip.drivers?.contact || '',
          time: trip.start_time ? dayjs(trip.start_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
          return_time: trip.end_time ? dayjs(trip.end_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
          special_notes: trip.special_instructions || 'None',
          ui_service_type: trip.service_type
        }));
        setTrips(formattedTrips);
        setCount(count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trips.",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('id, name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase.from('vehicles').select('id, make, model');
      if (error) throw error;
      
      const vehiclesWithDetails = data?.map(vehicle => ({
        id: vehicle.id,
        details: `${vehicle.make} ${vehicle.model}`
      })) || [];
      
      setVehicles(vehiclesWithDetails);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase.from('drivers').select('id, name, avatar_url, contact');
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      id: '',
      client_id: '',
      vehicle_id: '',
      driver_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      start_time: '',
      end_time: '',
      service_type: 'airport_pickup',
      status: 'scheduled',
      amount: 0,
      pickup_location: '',
      dropoff_location: '',
      flight_number: '',
      airline: '',
      terminal: '',
      special_instructions: '',
      is_recurring: false,
      notes: '',
      invoice_id: '',
      created_at: '',
      updated_at: ''
    });
  };

  const handleEditClickOpen = (trip: DisplayTrip) => {
    setEditForm(trip);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleDeleteClickOpen = (id: string) => {
    setTripToDelete(id);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setTripToDelete(null);
    setDeleteOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setForm(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setEditForm(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditSelectChange = (name: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setForm(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const handleEditDateChange = (date: Date | undefined) => {
    if (date) {
      setEditForm(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([{ ...form, id: uuidv4() }]);

      if (error) {
        console.error('Error creating trip:', error);
        toast({
          title: "Error",
          description: "Failed to create trip.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Trip created successfully!",
        });
        fetchTrips();
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to create trip:', error);
      toast({
        title: "Error",
        description: "Failed to create trip.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          client_id: editForm.client_id,
          vehicle_id: editForm.vehicle_id,
          driver_id: editForm.driver_id,
          date: editForm.date,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          service_type: editForm.service_type,
          status: editForm.status,
          amount: editForm.amount,
          pickup_location: editForm.pickup_location,
          dropoff_location: editForm.dropoff_location,
          flight_number: editForm.flight_number,
          airline: editForm.airline,
          terminal: editForm.terminal,
          special_instructions: editForm.special_instructions,
          is_recurring: editForm.is_recurring,
          notes: editForm.notes,
          invoice_id: editForm.invoice_id
        })
        .eq('id', editForm.id);

      if (error) {
        console.error('Error updating trip:', error);
        toast({
          title: "Error",
          description: "Failed to update trip.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Trip updated successfully!",
        });
        fetchTrips();
      }
      
      handleEditClose();
    } catch (error) {
      console.error('Failed to update trip:', error);
      toast({
        title: "Error",
        description: "Failed to update trip.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!tripToDelete) {
        console.error('No trip ID to delete.');
        return;
      }

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripToDelete);

      if (error) {
        console.error('Error deleting trip:', error);
        toast({
          title: "Error",
          description: "Failed to delete trip.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Trip deleted successfully!",
        });
        fetchTrips();
      }

      handleDeleteClose();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip.",
        variant: "destructive",
      });
    }
  };

  const handleChangePage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Button onClick={handleClickOpen}>
          <Plus className="mr-2 h-4 w-4" /> Add Trip
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.client_name}</TableCell>
                  <TableCell>{trip.vehicle_details}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
                        <AvatarFallback>{trip.driver_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{trip.driver_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{dayjs(trip.date).format('MMM D, YYYY')}</TableCell>
                  <TableCell>{trip.time}</TableCell>
                  <TableCell>{trip.return_time}</TableCell>
                  <TableCell>{trip.service_type}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>${trip.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClickOpen(trip)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteClickOpen(trip.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {trips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6">
                    No trips found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-1">
          {Array.from({ length: Math.ceil(count / rowsPerPage) }, (_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handleChangePage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Trip Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Trip</DialogTitle>
            <DialogDescription>
              Enter the details for the new trip.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select onValueChange={(value) => handleSelectChange('client_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
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
                <Label htmlFor="vehicle_id">Vehicle</Label>
                <Select onValueChange={(value) => handleSelectChange('vehicle_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.details}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver</Label>
                <Select onValueChange={(value) => handleSelectChange('driver_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
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
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date ? format(new Date(form.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.date ? new Date(form.date) : undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange('service_type', value)} 
                  defaultValue={form.service_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="one_way_transfer">One Way Transfer</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                    <SelectItem value="security_escort">Security Escort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange('status', value)} 
                  defaultValue={form.status}
                >
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
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location</Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Dropoff Location</Label>
                <Input
                  id="dropoff_location"
                  name="dropoff_location"
                  value={form.dropoff_location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  name="flight_number"
                  value={form.flight_number}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airline">Airline</Label>
                <Input
                  id="airline"
                  name="airline"
                  value={form.airline}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terminal">Terminal</Label>
                <Input
                  id="terminal"
                  name="terminal"
                  value={form.terminal}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Input
                id="special_instructions"
                name="special_instructions"
                value={form.special_instructions}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Create Trip
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update the trip details.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  onValueChange={(value) => handleEditSelectChange('client_id', value)} 
                  defaultValue={editForm.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
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
                <Label htmlFor="vehicle_id">Vehicle</Label>
                <Select 
                  onValueChange={(value) => handleEditSelectChange('vehicle_id', value)} 
                  defaultValue={editForm.vehicle_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.details}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_id">Driver</Label>
                <Select 
                  onValueChange={(value) => handleEditSelectChange('driver_id', value)} 
                  defaultValue={editForm.driver_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
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
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.date ? format(new Date(editForm.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editForm.date ? new Date(editForm.date) : undefined}
                      onSelect={handleEditDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={editForm.start_time}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={editForm.end_time}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select 
                  onValueChange={(value) => handleEditSelectChange('service_type', value)} 
                  defaultValue={editForm.service_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="airport_dropoff">Airport Dropoff</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="one_way_transfer">One Way Transfer</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                    <SelectItem value="security_escort">Security Escort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  onValueChange={(value) => handleEditSelectChange('status', value)} 
                  defaultValue={editForm.status}
                >
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
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={editForm.amount}
                onChange={handleEditInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location</Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  value={editForm.pickup_location}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Dropoff Location</Label>
                <Input
                  id="dropoff_location"
                  name="dropoff_location"
                  value={editForm.dropoff_location}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  name="flight_number"
                  value={editForm.flight_number}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airline">Airline</Label>
                <Input
                  id="airline"
                  name="airline"
                  value={editForm.airline}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terminal">Terminal</Label>
                <Input
                  id="terminal"
                  name="terminal"
                  value={editForm.terminal}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Input
                id="special_instructions"
                name="special_instructions"
                value={editForm.special_instructions}
                onChange={handleEditInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={editForm.notes}
                onChange={handleEditInputChange}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleEditClose}>
                Cancel
              </Button>
              <Button type="submit">
                Update Trip
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trips;
