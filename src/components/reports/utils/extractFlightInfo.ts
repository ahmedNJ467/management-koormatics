
// Function to extract flight information from notes
export function extractFlightInfo(notes: string) {
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
}
