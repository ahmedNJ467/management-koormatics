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
  
  // Check if there's a passengers section
  const passengersMatch = notes.match(/Passengers:\s*\n((?:- [^\n]+\n?)+)/i);
  
  if (!passengersMatch || !passengersMatch[1]) {
    // Try alternative format (without bullet points)
    const altFormatMatch = notes.match(/Passengers:\s*\n((?:[^\n-][^\n]*\n?)+)/i);
    if (altFormatMatch && altFormatMatch[1]) {
      return altFormatMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
    return [];
  }
  
  // Extract passenger names from bullet points
  return passengersMatch[1]
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(line => line.length > 0);
};

// Format service type for UI display
export const formatServiceType = (type: string): string => {
  return type
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Extract trip status from notes
export const extractTripStatus = (notes?: string): string => {
  if (!notes) return 'scheduled';
  
  const statusMatch = notes.match(/^STATUS:([a-z_]+)/i);
  return statusMatch ? statusMatch[1].toLowerCase() : 'scheduled';
};
