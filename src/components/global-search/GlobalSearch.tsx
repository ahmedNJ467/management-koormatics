
import { useState, useEffect } from "react";
import { Search, X, FileText, Users, Car, UserCheck, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'trip' | 'client' | 'vehicle' | 'driver';
  data: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const searchResults: SearchResult[] = [];
        
        // Search trips
        const { data: trips } = await supabase
          .from('trips')
          .select(`
            *, 
            clients(name),
            vehicles(make, model, registration),
            drivers(name)
          `)
          .or(`pickup_location.ilike.%${searchTerm}%,dropoff_location.ilike.%${searchTerm}%,flight_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
          .limit(5);

        trips?.forEach(trip => {
          searchResults.push({
            id: trip.id,
            title: `${trip.pickup_location || 'N/A'} → ${trip.dropoff_location || 'N/A'}`,
            subtitle: `${trip.date} • ${trip.clients?.name || 'No client'} • ${trip.status}`,
            type: 'trip',
            data: trip
          });
        });

        // Search clients
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
          .limit(5);

        clients?.forEach(client => {
          searchResults.push({
            id: client.id,
            title: client.name,
            subtitle: `${client.type} • ${client.email || client.contact || 'No contact'}`,
            type: 'client',
            data: client
          });
        });

        // Search vehicles
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*')
          .or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,registration.ilike.%${searchTerm}%`)
          .limit(5);

        vehicles?.forEach(vehicle => {
          searchResults.push({
            id: vehicle.id,
            title: `${vehicle.make} ${vehicle.model}`,
            subtitle: `${vehicle.registration} • ${vehicle.status}`,
            type: 'vehicle',
            data: vehicle
          });
        });

        // Search drivers
        const { data: drivers } = await supabase
          .from('drivers')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%`)
          .limit(5);

        drivers?.forEach(driver => {
          searchResults.push({
            id: driver.id,
            title: driver.name,
            subtitle: `${driver.license_number} • ${driver.status}`,
            type: 'driver',
            data: driver
          });
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trip': return <Calendar className="h-4 w-4" />;
      case 'client': return <Users className="h-4 w-4" />;
      case 'vehicle': return <Car className="h-4 w-4" />;
      case 'driver': return <UserCheck className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trip': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'client': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'vehicle': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'driver': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'trip':
        navigate('/trips');
        break;
      case 'client':
        navigate('/clients');
        break;
      case 'vehicle':
        navigate('/vehicles');
        break;
      case 'driver':
        navigate('/drivers');
        break;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search trips, clients, vehicles, drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg"
              autoFocus
            />
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="max-h-96">
            {isLoading && (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            )}
            
            {!isLoading && searchTerm && results.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{searchTerm}"
              </div>
            )}
            
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{result.title}</h4>
                      <Badge variant="outline" className={`${getTypeColor(result.type)} capitalize`}>
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
