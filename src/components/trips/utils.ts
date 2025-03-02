
// utils.ts

// Format date
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (timeStr: string): string => {
  const timeParts = timeStr.split(':');
  if (timeParts.length < 2) return timeStr; // Handle invalid time strings
  let hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Extract trip status from notes field
export const extractTripStatus = (notes?: string): string | null => {
  if (!notes) return null;
  
  const statusMatch = notes.match(/^STATUS:([a-z_]+)/i);
  if (statusMatch && statusMatch[1]) {
    return statusMatch[1].toLowerCase();
  }
  
  return null;
};

// Parse flight details from notes
export const parseFlightDetails = (notes?: string): { 
  flight?: string; 
  airline?: string; 
  terminal?: string; 
} => {
  if (!notes) return {};
  
  const result: { flight?: string; airline?: string; terminal?: string; } = {};
  
  // Extract flight details
  const flightMatch = notes.match(/Flight:\s*([^\n]+)/);
  if (flightMatch && flightMatch[1]) {
    result.flight = flightMatch[1].trim();
  }
  
  const airlineMatch = notes.match(/Airline:\s*([^\n]+)/);
  if (airlineMatch && airlineMatch[1]) {
    result.airline = airlineMatch[1].trim();
  }
  
  const terminalMatch = notes.match(/Terminal:\s*([^\n]+)/);
  if (terminalMatch && terminalMatch[1]) {
    result.terminal = terminalMatch[1].trim();
  }
  
  return result;
};

// Parse passenger information from notes
export const parsePassengers = (notes?: string): string[] => {
  if (!notes) return [];
  
  const passengersSection = notes.match(/Passengers:\n([\s\S]*?)(?:\n\n|$)/);
  if (!passengersSection) return [];
  
  return passengersSection[1]
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(Boolean);
};

// Extract flight information for display
export const extractFlightInfo = (notes?: string): string => {
  if (!notes) return '';
  
  let flightInfo = '';
  
  const flightNumberMatch = notes.match(/Flight:?\s*([A-Z0-9]{2,}\s*[0-9]{1,4}[A-Z]?)/i);
  const airlineMatch = notes.match(/Airline:?\s*([^,\n]+)/i);
  const terminalMatch = notes.match(/Terminal:?\s*([^,\n]+)/i);
  
  if (flightNumberMatch) {
    flightInfo += `${flightNumberMatch[1].trim()}`;
  }
  
  if (airlineMatch) {
    flightInfo += flightInfo ? `, ${airlineMatch[1].trim()}` : `${airlineMatch[1].trim()}`;
  }
  
  if (terminalMatch) {
    flightInfo += flightInfo ? `, ${terminalMatch[1].trim()}` : `${terminalMatch[1].trim()}`;
  }
  
  return flightInfo;
};
