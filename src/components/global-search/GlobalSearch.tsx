
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Car, Users, Calendar, FileText, Wrench, Fuel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: any;
  route: string;
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

  const searchCategories = [
    { name: "Vehicles", icon: Car, table: "vehicles" as const, fields: ["make", "model", "registration"], route: "/vehicles" },
    { name: "Drivers", icon: Users, table: "drivers" as const, fields: ["name", "contact", "license_number"], route: "/drivers" },
    { name: "Trips", icon: Calendar, table: "trips" as const, fields: ["pickup_location", "dropoff_location"], route: "/trips" },
    { name: "Clients", icon: Users, table: "clients" as const, fields: ["name", "contact", "email"], route: "/clients" },
    { name: "Maintenance", icon: Wrench, table: "maintenance" as const, fields: ["description", "service_provider"], route: "/maintenance" },
    { name: "Fuel Logs", icon: Fuel, table: "fuel_logs" as const, fields: [], route: "/fuel-logs" }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          setSearchTerm("");
          setResults([]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      for (const category of searchCategories) {
        try {
          let query = supabase.from(category.table).select('*');
          
          if (category.fields.length > 0) {
            // Build OR conditions for text search
            const searchConditions = category.fields.map(field => 
              `${field}.ilike.%${searchTerm}%`
            ).join(',');

            const { data, error } = await query.or(searchConditions).limit(5);
            
            if (error) {
              console.error(`Error searching ${category.table}:`, error);
              continue;
            }

            if (data && data.length > 0) {
              data.forEach((item: any) => {
                let title = "";
                let subtitle = "";

                switch (category.table) {
                  case "vehicles":
                    title = `${item.make || ''} ${item.model || ''}`.trim();
                    subtitle = `Registration: ${item.registration || 'N/A'}`;
                    break;
                  case "drivers":
                    title = item.name || 'Unknown Driver';
                    subtitle = `License: ${item.license_number || 'N/A'}`;
                    break;
                  case "trips":
                    title = `${item.pickup_location || 'Unknown'} → ${item.dropoff_location || 'Unknown'}`;
                    subtitle = `Date: ${item.date || 'N/A'}`;
                    break;
                  case "clients":
                    title = item.name || 'Unknown Client';
                    subtitle = item.email || item.contact || 'No contact info';
                    break;
                  case "maintenance":
                    title = item.description || 'Maintenance Record';
                    subtitle = `Provider: ${item.service_provider || 'N/A'}`;
                    break;
                  case "fuel_logs":
                    title = `Fuel Log - ${item.date || 'Unknown Date'}`;
                    subtitle = `Cost: $${item.cost || '0'}`;
                    break;
                  default:
                    title = "Unknown Item";
                    subtitle = "";
                }

                searchResults.push({
                  id: item.id,
                  title,
                  subtitle,
                  type: category.name,
                  icon: category.icon,
                  route: category.route
                });
              });
            }
          }
        } catch (error) {
          console.error(`Error searching ${category.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }

    setResults(searchResults);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    onClose();
    setSearchTerm("");
    setResults([]);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Global Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all fleet data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {searchTerm.length > 0 && searchTerm.length <= 2 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Type at least 3 characters to search...
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Searching...
            </div>
          )}

          {searchTerm.length > 2 && !isLoading && results.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No results found for "{searchTerm}"
            </div>
          )}

          {results.length > 0 && (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {type} ({typeResults.length})
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {typeResults.map((result) => {
                        const IconComponent = result.icon;
                        return (
                          <div
                            key={result.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(result)}
                          >
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">⌘K</kbd> to open search
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
