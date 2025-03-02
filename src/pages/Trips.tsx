import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  IconButton,
  Avatar,
  Stack,
  Pagination,
  Box,
  Typography,
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '@/integrations/supabase/client';
import { DisplayTrip, ServiceType } from "@/lib/types/trip";

const Trips = () => {
  const [trips, setTrips] = useState<DisplayTrip[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
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
  const [drivers, setDrivers] = useState<{ id: string; name: string; avatar_url?: string; contact_number?: string }[]>([]);
    const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const rowsPerPage = 5;

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
        .select('*, clients(name, type), vehicles(details), drivers(name, avatar_url, contact_number)', { count: 'exact' })
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
          vehicle_details: trip.vehicles?.details || 'Unknown Vehicle',
          driver_name: trip.drivers?.name || 'Unknown Driver',
          driver_avatar: trip.drivers?.avatar_url || '',
          driver_contact: trip.drivers?.contact_number || '',
          time: trip.start_time ? dayjs(trip.start_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
          return_time: trip.end_time ? dayjs(trip.end_time, 'HH:mm:ss').format('h:mm A') : 'N/A',
          special_notes: trip.special_instructions || 'None',
          ui_service_type: trip.service_type || 'other'
        }));
        setTrips(formattedTrips);
        setCount(count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      setSnackbarMessage('Failed to fetch trips.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
      const { data, error } = await supabase.from('vehicles').select('id, details');
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase.from('drivers').select('id, name, avatar_url, contact_number');
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
    setEditForm({
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
  };

  const handleDeleteClickOpen = (id: string) => {
    setTripToDelete(id);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setTripToDelete(null);
    setDeleteOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleDateChange = (date: Dayjs | null) => {
    setForm(prevForm => ({
      ...prevForm,
      date: date ? date.format('YYYY-MM-DD') : ''
    }));
  };

  const handleEditDateChange = (date: Dayjs | null) => {
    setEditForm(prevForm => ({
      ...prevForm,
      date: date ? date.format('YYYY-MM-DD') : ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([{ ...form, id: uuidv4() }]);

      if (error) {
        console.error('Error creating trip:', error);
        setSnackbarMessage('Failed to create trip.');
        setSnackbarSeverity('error');
      } else {
        setSnackbarMessage('Trip created successfully!');
        setSnackbarSeverity('success');
        fetchTrips();
      }
      setSnackbarOpen(true);
      handleClose();
    } catch (error) {
      console.error('Failed to create trip:', error);
      setSnackbarMessage('Failed to create trip.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(editForm)
        .eq('id', editForm.id);

      if (error) {
        console.error('Error updating trip:', error);
        setSnackbarMessage('Failed to update trip.');
        setSnackbarSeverity('error');
      } else {
        setSnackbarMessage('Trip updated successfully!');
        setSnackbarSeverity('success');
        fetchTrips();
      }
      setSnackbarOpen(true);
      handleEditClose();
    } catch (error) {
      console.error('Failed to update trip:', error);
      setSnackbarMessage('Failed to update trip.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
        setSnackbarMessage('Failed to delete trip.');
        setSnackbarSeverity('error');
      } else {
        setSnackbarMessage('Trip deleted successfully!');
        setSnackbarSeverity('success');
        fetchTrips();
      }

      setSnackbarOpen(true);
      handleDeleteClose();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      setSnackbarMessage('Failed to delete trip.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Trips
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
          Add Trip
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.map((trip) => (
              <TableRow
                key={trip.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {trip.client_name}
                </TableCell>
                <TableCell>{trip.vehicle_details}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar alt={trip.driver_name} src={trip.driver_avatar} />
                    <span>{trip.driver_name}</span>
                  </Stack>
                </TableCell>
                <TableCell>{dayjs(trip.date).format('MMMM D, YYYY')}</TableCell>
                <TableCell>{trip.time}</TableCell>
                <TableCell>{trip.return_time}</TableCell>
                <TableCell>{trip.service_type}</TableCell>
                <TableCell>{trip.status}</TableCell>
                <TableCell>{trip.amount}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleEditClickOpen(trip)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDeleteClickOpen(trip.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={Math.ceil(count / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
        />
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Add New Trip
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="client-id"
                options={clients}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setForm(prevForm => ({
                    ...prevForm,
                    client_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Client" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="vehicle-id"
                options={vehicles}
                getOptionLabel={(option) => option.details}
                onChange={(event, newValue) => {
                  setForm(prevForm => ({
                    ...prevForm,
                    vehicle_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Vehicle" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="driver-id"
                options={drivers}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setForm(prevForm => ({
                    ...prevForm,
                    driver_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Driver" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={dayjs(form.date)}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Start Time"
              name="start_time"
              type="time"
              InputLabelProps={{
                shrink: true,
              }}
              value={form.start_time}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="End Time"
              name="end_time"
              type="time"
              InputLabelProps={{
                shrink: true,
              }}
              value={form.end_time}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="service_type-label">Service Type</InputLabel>
              <Select
                labelId="service_type-label"
                id="service_type"
                name="service_type"
                value={form.service_type}
                label="Service Type"
                onChange={handleInputChange}
              >
                <MenuItem value="airport_pickup">Airport Pickup</MenuItem>
                <MenuItem value="airport_dropoff">Airport Dropoff</MenuItem>
                <MenuItem value="full_day">Full Day</MenuItem>
                <MenuItem value="one_way_transfer">One Way Transfer</MenuItem>
                <MenuItem value="round_trip">Round Trip</MenuItem>
                <MenuItem value="security_escort">Security Escort</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={form.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Pickup Location"
              name="pickup_location"
              value={form.pickup_location}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Dropoff Location"
              name="dropoff_location"
              value={form.dropoff_location}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Flight Number"
              name="flight_number"
              value={form.flight_number}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Airline"
              name="airline"
              value={form.airline}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Terminal"
              name="terminal"
              value={form.terminal}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Special Instructions"
              name="special_instructions"
              value={form.special_instructions}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="is_recurring-label">Is Recurring</InputLabel>
              <Select
                labelId="is_recurring-label"
                id="is_recurring"
                name="is_recurring"
                value={form.is_recurring}
                label="Is Recurring"
                onChange={handleInputChange}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Invoice ID"
              name="invoice_id"
              value={form.invoice_id}
              onChange={handleInputChange}
            />
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">Create</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Edit Trip
          <IconButton
            aria-label="close"
            onClick={handleEditClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="client-id"
                options={clients}
                getOptionLabel={(option) => option.name}
                value={clients.find(client => client.id === editForm.client_id) || null}
                onChange={(event, newValue) => {
                  setEditForm(prevForm => ({
                    ...prevForm,
                    client_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Client" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="vehicle-id"
                options={vehicles}
                getOptionLabel={(option) => option.details}
                value={vehicles.find(vehicle => vehicle.id === editForm.vehicle_id) || null}
                onChange={(event, newValue) => {
                  setEditForm(prevForm => ({
                    ...prevForm,
                    vehicle_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Vehicle" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                id="driver-id"
                options={drivers}
                getOptionLabel={(option) => option.name}
                value={drivers.find(driver => driver.id === editForm.driver_id) || null}
                onChange={(event, newValue) => {
                  setEditForm(prevForm => ({
                    ...prevForm,
                    driver_id: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => <TextField {...params} label="Driver" />}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={dayjs(editForm.date)}
                  onChange={handleEditDateChange}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Start Time"
              name="start_time"
              type="time"
              InputLabelProps={{
                shrink: true,
              }}
              value={editForm.start_time}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="End Time"
              name="end_time"
              type="time"
              InputLabelProps={{
                shrink: true,
              }}
              value={editForm.end_time}
              onChange={handleEditInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="service_type-label">Service Type</InputLabel>
              <Select
                labelId="service_type-label"
                id="service_type"
                name="service_type"
                value={editForm.service_type}
                label="Service Type"
                onChange={handleEditInputChange}
              >
                <MenuItem value="airport_pickup">Airport Pickup</MenuItem>
                <MenuItem value="airport_dropoff">Airport Dropoff</MenuItem>
                <MenuItem value="full_day">Full Day</MenuItem>
                <MenuItem value="one_way_transfer">One Way Transfer</MenuItem>
                <MenuItem value="round_trip">Round Trip</MenuItem>
                <MenuItem value="security_escort">Security Escort</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={editForm.status}
                label="Status"
                onChange={handleEditInputChange}
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Amount"
              name="amount"
              type="number"
              value={editForm.amount}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Pickup Location"
              name="pickup_location"
              value={editForm.pickup_location}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Dropoff Location"
              name="dropoff_location"
              value={editForm.dropoff_location}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Flight Number"
              name="flight_number"
              value={editForm.flight_number}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Airline"
              name="airline"
              value={editForm.airline}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Terminal"
              name="terminal"
              value={editForm.terminal}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Special Instructions"
              name="special_instructions"
              value={editForm.special_instructions}
              onChange={handleEditInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="is_recurring-label">Is Recurring</InputLabel>
              <Select
                labelId="is_recurring-label"
                id="is_recurring"
                name="is_recurring"
                value={editForm.is_recurring}
                label="Is Recurring"
                onChange={handleEditInputChange}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              name="notes"
              value={editForm.notes}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Invoice ID"
              name="invoice_id"
              value={editForm.invoice_id}
              onChange={handleEditInputChange}
            />
            <DialogActions>
              <Button onClick={handleEditClose}>Cancel</Button>
              <Button type="submit" variant="contained">Update</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Trip?"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Are you sure you want to delete this trip? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Trips;
