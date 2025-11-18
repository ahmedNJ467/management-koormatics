import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Client } from "@/lib/types";

interface ClientSearchSelectProps {
  clients?: Client[];
  value: string;
  onValueChange: (clientId: string) => void;
  required?: boolean;
}

export function ClientSearchSelect({
  clients = [],
  value,
  onValueChange,
  required = false,
}: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const selectedClient = clients.find((client) => client.id === value);

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.type?.toLowerCase().includes(query)
    );
  });

  // Check if search query doesn't match any client
  const noMatch = searchQuery.trim() !== "" && filteredClients.length === 0;

  const handleCreateClient = () => {
    setOpen(false);
    // Navigate to clients page with create query param
    router.push("/clients?create=true");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="client_id">Client</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id="client_id"
          >
            {selectedClient
              ? `${selectedClient.name}${selectedClient.type === "organization" ? " 🏢" : ""}`
              : "Select client..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search clients by name, email, or phone..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {noMatch ? (
                  <div className="py-6 text-center text-sm">
                    <p className="mb-2">No client found matching "{searchQuery}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateClient}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Client
                    </Button>
                  </div>
                ) : (
                  "No clients found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.name} ${client.email || ""} ${client.phone || ""}`}
                    onSelect={() => {
                      onValueChange(client.id);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <span>{client.name}</span>
                      {client.type === "organization" && <span>🏢</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchQuery && (
                <>
                  <div className="border-t" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateClient}
                      className="text-primary cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Client
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {required && !value && (
        <p className="text-xs text-destructive">Client is required</p>
      )}
    </div>
  );
}

