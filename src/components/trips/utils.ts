
// Helper function to parse flight details from notes
export const parseFlightDetails = (notes?: string) => {
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
export const parsePassengers = (notes?: string): string[] => {
  if (!notes) return [];
  
  const passengersMatch = notes.match(/Passengers:\s*\n(.*?)(\n\n|\n$|$)/s);
  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1].split('\n').filter(p => p.trim());
  }
  
  return [];
};

// Format service type for UI display
export const formatServiceType = (type: string): string => {
  return type
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
