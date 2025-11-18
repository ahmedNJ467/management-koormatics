import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
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
import { Vehicle } from "@/lib/types";

interface VehicleSearchSelectProps {
  vehicles?: Vehicle[];
  value: string;
  onValueChange: (vehicleId: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function VehicleSearchSelect({
  vehicles = [],
  value,
  onValueChange,
  disabled = false,
  required = false,
  placeholder = "Choose a vehicle...",
}: VehicleSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === value);

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(query) ||
      vehicle.model?.toLowerCase().includes(query) ||
      vehicle.registration?.toLowerCase().includes(query) ||
      `${vehicle.make} ${vehicle.model} ${vehicle.registration}`.toLowerCase().includes(query)
    );
  });

  const displayText = selectedVehicle
    ? `${selectedVehicle.make} ${selectedVehicle.model} - ${selectedVehicle.registration}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 min-w-[200px]" align="start">
        <Command className="w-full">
          <CommandInput
            placeholder="Search vehicles by make, model, or registration..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery ? (
                `No vehicle found matching "${searchQuery}"`
              ) : (
                "No vehicles found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredVehicles.map((vehicle) => (
                <CommandItem
                  key={vehicle.id}
                  value={`${vehicle.make} ${vehicle.model} ${vehicle.registration}`}
                  onSelect={() => {
                    onValueChange(vehicle.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vehicle.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>
                    {vehicle.make} {vehicle.model} - {vehicle.registration}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

