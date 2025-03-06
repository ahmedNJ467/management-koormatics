
import { format, parseISO, differenceInHours, startOfMonth, endOfMonth, subMonths, getMonth, getYear, getDay } from 'date-fns';
import { DisplayTrip, TripType, TripStatus } from '@/lib/types/trip';
import { tripTypeDisplayMap } from '@/lib/types/trip';

export interface TripMetrics {
  totalTrips: number;
  totalRevenue: number;
  averageRevenue: number;
  averageDuration: number;
  tripsWithDuration: number;
  tripTrend: number;
  vehicleUtilization: number;
  mostUsedVehicle: string;
  monthlyTripCounts: { month: string; count: number }[];
  tripTypeDistribution: { name: string; value: number }[];
}

export function calculateTripMetrics(trips: DisplayTrip[] = []): TripMetrics {
  // Basic metrics
  const totalTrips = trips.length;
  const totalRevenue = trips.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  const averageRevenue = totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0;

  // Calculate average duration
  let tripsWithDuration = 0;
  let totalDuration = 0;

  trips.forEach(trip => {
    if (trip.start_time && trip.end_time) {
      const startDate = new Date(`${trip.date}T${trip.start_time}`);
      const endDate = new Date(`${trip.date}T${trip.end_time}`);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const duration = differenceInHours(endDate, startDate);
        if (duration > 0) {
          totalDuration += duration;
          tripsWithDuration++;
        }
      }
    }
  });

  const averageDuration = tripsWithDuration > 0 
    ? Math.round((totalDuration / tripsWithDuration) * 10) / 10 
    : 0;

  // Calculate trip trend (current month vs previous month)
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const prevMonthStart = startOfMonth(subMonths(currentDate, 1));
  const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));

  const currentMonthTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate >= currentMonthStart && tripDate <= currentMonthEnd;
  }).length;

  const prevMonthTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate >= prevMonthStart && tripDate <= prevMonthEnd;
  }).length;

  const tripTrend = prevMonthTrips > 0 
    ? Math.round(((currentMonthTrips - prevMonthTrips) / prevMonthTrips) * 100) 
    : 0;

  // Calculate vehicle utilization
  const vehicleCounts: Record<string, number> = {};
  let topVehicleId = '';
  let topVehicleCount = 0;
  let topVehicleName = 'N/A';

  trips.forEach(trip => {
    if (trip.vehicle_id) {
      vehicleCounts[trip.vehicle_id] = (vehicleCounts[trip.vehicle_id] || 0) + 1;
      
      if (vehicleCounts[trip.vehicle_id] > topVehicleCount) {
        topVehicleCount = vehicleCounts[trip.vehicle_id];
        topVehicleId = trip.vehicle_id;
        topVehicleName = trip.vehicle_details || 'Unknown vehicle';
      }
    }
  });

  const vehicleUtilization = totalTrips > 0 && topVehicleCount > 0
    ? Math.round((topVehicleCount / totalTrips) * 100)
    : 0;

  // Monthly trip counts
  const monthlyData: Record<string, number> = {};
  
  trips.forEach(trip => {
    try {
      const date = new Date(trip.date);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    } catch (error) {
      console.error('Invalid date:', trip.date);
    }
  });

  const monthlyTripCounts = Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  // Trip type distribution
  const typeCount: Record<string, number> = {};
  
  trips.forEach(trip => {
    const type = trip.type || 'other';
    const displayType = tripTypeDisplayMap[type as TripType] || type;
    typeCount[displayType] = (typeCount[displayType] || 0) + 1;
  });

  const tripTypeDistribution = Object.entries(typeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    totalTrips,
    totalRevenue,
    averageRevenue,
    averageDuration,
    tripsWithDuration,
    tripTrend,
    vehicleUtilization,
    mostUsedVehicle: topVehicleName,
    monthlyTripCounts,
    tripTypeDistribution
  };
}

// Function to calculate trip distribution data
export function calculateTripDistribution(trips: DisplayTrip[] = []) {
  // Client type distribution
  const clientTypeCounts: Record<string, number> = { 
    Organization: 0, 
    Individual: 0,
    Unknown: 0 
  };
  
  trips.forEach(trip => {
    if (trip.client_type === 'organization') {
      clientTypeCounts.Organization++;
    } else if (trip.client_type === 'individual') {
      clientTypeCounts.Individual++;
    } else {
      clientTypeCounts.Unknown++;
    }
  });

  const clientTypes = Object.entries(clientTypeCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  // Status distribution
  const statusCounts: Record<string, number> = {};
  
  trips.forEach(trip => {
    const status = trip.status || 'Unknown';
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    statusCounts[formattedStatus] = (statusCounts[formattedStatus] || 0) + 1;
  });

  const tripStatus = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }));

  // Top clients
  const clientCounts: Record<string, number> = {};
  const clientNames: Record<string, string> = {};
  
  trips.forEach(trip => {
    if (trip.client_id && trip.client_name) {
      clientCounts[trip.client_id] = (clientCounts[trip.client_id] || 0) + 1;
      clientNames[trip.client_id] = trip.client_name;
    }
  });

  const topClients = Object.entries(clientCounts)
    .map(([id, value]) => ({ name: clientNames[id] || 'Unknown', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    clientTypes,
    tripStatus,
    topClients
  };
}

// Function to calculate trip trends
export function calculateTripTrends(trips: DisplayTrip[] = []) {
  // Trip volume over time
  const monthlyVolume: Record<string, number> = {};
  
  trips.forEach(trip => {
    try {
      const date = new Date(trip.date);
      const monthKey = format(date, 'MMM yyyy');
      monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + 1;
    } catch (error) {
      console.error('Invalid date:', trip.date);
    }
  });

  const tripVolume = Object.entries(monthlyVolume)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA.getTime() - dateB.getTime();
    });

  // Day of week distribution
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounters = Array(7).fill(0);
  
  trips.forEach(trip => {
    try {
      const date = new Date(trip.date);
      const dayOfWeek = getDay(date);
      dayCounters[dayOfWeek]++;
    } catch (error) {
      console.error('Invalid date:', trip.date);
    }
  });

  const dayOfWeekDistribution = dayNames.map((name, index) => ({
    name,
    value: dayCounters[index]
  }));

  // Revenue by month
  const monthlyRevenue: Record<string, number> = {};
  
  trips.forEach(trip => {
    try {
      const date = new Date(trip.date);
      const monthKey = format(date, 'MMM yyyy');
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(trip.amount || 0);
    } catch (error) {
      console.error('Invalid date:', trip.date);
    }
  });

  const revenueByMonth = Object.entries(monthlyRevenue)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA.getTime() - dateB.getTime();
    });

  return {
    tripVolume,
    dayOfWeekDistribution,
    revenueByMonth
  };
}

// Function to calculate revenue analytics
export function calculateRevenueAnalytics(trips: DisplayTrip[] = []) {
  // Basic revenue metrics
  const totalRevenue = trips.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  const averageTripValue = trips.length > 0 ? Math.round(totalRevenue / trips.length) : 0;
  const highestTripValue = trips.reduce((max, trip) => Math.max(max, Number(trip.amount || 0)), 0);

  // Revenue by service type
  const revenueByTypeMap: Record<string, number> = {};
  
  trips.forEach(trip => {
    const type = trip.type || 'other';
    const displayType = tripTypeDisplayMap[type as TripType] || type;
    revenueByTypeMap[displayType] = (revenueByTypeMap[displayType] || 0) + Number(trip.amount || 0);
  });

  const revenueByType = Object.entries(revenueByTypeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Revenue by client
  const revenueByClient: Record<string, { id: string; name: string; value: number }> = {};
  
  trips.forEach(trip => {
    if (trip.client_id && trip.client_name) {
      if (!revenueByClient[trip.client_id]) {
        revenueByClient[trip.client_id] = { 
          id: trip.client_id, 
          name: trip.client_name, 
          value: 0 
        };
      }
      revenueByClient[trip.client_id].value += Number(trip.amount || 0);
    }
  });

  const topRevenueClients = Object.values(revenueByClient)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(client => ({ name: client.name, value: client.value }));

  // Revenue by month
  const monthlyRevenue: Record<string, number> = {};
  
  trips.forEach(trip => {
    try {
      const date = new Date(trip.date);
      const monthKey = format(date, 'MMM yyyy');
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(trip.amount || 0);
    } catch (error) {
      console.error('Invalid date:', trip.date);
    }
  });

  const revenueByMonth = Object.entries(monthlyRevenue)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA.getTime() - dateB.getTime();
    });

  return {
    totalRevenue,
    averageTripValue,
    highestTripValue,
    revenueByType,
    topRevenueClients,
    revenueByMonth
  };
}
