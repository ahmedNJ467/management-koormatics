
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
// This is kept for backward compatibility with existing data
export const extractTripStatus = (notes?: string): string | null => {
  if (!notes) return null;
  
  const statusMatch = notes.match(/^STATUS:([a-z_]+)/i);
  if (statusMatch && statusMatch[1]) {
    return statusMatch[1].toLowerCase();
  }
  
  return null;
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

// The following functions are no longer needed since we store flight info in dedicated columns
// but are kept for backward compatibility with old data

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
