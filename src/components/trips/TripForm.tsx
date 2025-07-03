import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TripFormProps, UIServiceType } from "./form/types";
import { PassengerManagement } from "./form/PassengerManagement";
import { DocumentUploads } from "./form/DocumentUploads";
import { FlightDetails } from "./form/FlightDetails";
import { RecurringTripFields } from "./form/RecurringTripFields";
import { TripStatusField } from "./form/TripStatusField";
import { ClientServiceSelects } from "./form/ClientServiceSelects";
import { LocationFields } from "./form/LocationFields";
import { DateTimeFields } from "./form/DateTimeFields";
import { NotesField } from "./form/NotesField";
import { FormFooter } from "./form/FormFooter";
import { AmountField } from "./form/AmountField";
import { SecurityEscortToggle } from "./form/SecurityEscortToggle";
import { formatUIServiceType } from "./form/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock } from "lucide-react";
import { VehicleType } from "@/lib/types";

export function TripForm({
  editTrip,
  clients,
  vehicles,
  drivers,
  trips,
  onClose,
  onSubmit,
}: TripFormProps) {
  const [serviceType, setServiceType] =
    useState<UIServiceType>("airport_pickup");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [passengers, setPassengers] = useState<string[]>([""]);
  const [newPassenger, setNewPassenger] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    editTrip?.date || ""
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    editTrip?.time || ""
  );
  const [hasSecurityEscort, setHasSecurityEscort] = useState<boolean>(false);
  const [escortCount, setEscortCount] = useState<number>(1);

  useEffect(() => {
    if (editTrip) {
      setServiceType(
        (editTrip.ui_service_type as UIServiceType) ||
          formatUIServiceType(editTrip)
      );
      setSelectedClientId(editTrip.client_id);
      setSelectedDate(editTrip.date);
      setSelectedTime(editTrip.time || "");

      const clientType = editTrip.client_type || "individual";
      setSelectedClientType(clientType);

      if (clientType === "organization") {
        // Get passengers from both dedicated passengers array and notes
        const extractedPassengers = editTrip.notes
          ? parsePassengers(editTrip.notes)
          : [];
        const arrayPassengers = Array.isArray(editTrip.passengers)
          ? editTrip.passengers
          : [];

        // Combine both sources and remove duplicates
        const allPassengers = [
          ...new Set([...arrayPassengers, ...extractedPassengers]),
        ];

        setPassengers(allPassengers.length > 0 ? allPassengers : [""]);
      } else {
        setPassengers([""]);
      }

      // Initialize security escort from editTrip data
      setHasSecurityEscort(editTrip.has_security_escort || false);
      setEscortCount(editTrip.escort_count || 1);
    } else {
      setServiceType("airport_pickup");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
      setHasSecurityEscort(false);
      setEscortCount(1);
    }
  }, [editTrip]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
      setSelectedClientType("");
      setPassengers([""]);
      return;
    }

    const selectedClient = clients?.find((client) => client.id === clientId);
    if (selectedClient) {
      setSelectedClientType(selectedClient.type || "individual");
      // Reset passengers when client changes
      setPassengers([""]);
    }
  };

  const handleDateTimeChange = (field: "date" | "time", value: string) => {
    if (field === "date") {
      setSelectedDate(value);
    } else {
      setSelectedTime(value);
    }
  };

  const addPassenger = () => {
    if (newPassenger.trim()) {
      setPassengers([
        ...passengers.filter((p) => p.trim()),
        newPassenger.trim(),
      ]);
      setNewPassenger("");
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = value;
    setPassengers(updatedPassengers);
  };

  const removePassenger = (index: number) => {
    const updatedPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(updatedPassengers.length ? updatedPassengers : [""]);
  };

  // Handle Enter key in the new passenger input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newPassenger.trim()) {
      e.preventDefault(); // Prevent form submission
      addPassenger();
    }
  };

  const validPassengers = passengers.filter((p) => p && p.trim() !== "");

  return (
    <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
      <form onSubmit={onSubmit} className="space-y-6">
        <input type="hidden" name="client_type" value={selectedClientType} />
        <input
          type="hidden"
          name="passengers"
          value={JSON.stringify(validPassengers)}
        />
        <input
          type="hidden"
          name="has_security_escort"
          value={hasSecurityEscort.toString()}
        />
        <input
          type="hidden"
          name="escort_count"
          value={escortCount.toString()}
        />
        {editTrip && (
          <input
            type="hidden"
            name="vehicle_type"
            value={editTrip.vehicle_type || ""}
          />
        )}

        <ClientServiceSelects
          clients={clients}
          editTrip={editTrip}
          selectedClientId={selectedClientId}
          serviceType={serviceType}
          handleClientChange={handleClientChange}
          setServiceType={setServiceType}
        />

        {!editTrip && (
          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select name="vehicle_type" required>
              <SelectTrigger id="vehicle_type">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft_skin">Soft Skin</SelectItem>
                <SelectItem value="armoured">Armoured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <SecurityEscortToggle
          hasSecurityEscort={hasSecurityEscort}
          setHasSecurityEscort={setHasSecurityEscort}
          escortCount={escortCount}
          setEscortCount={setEscortCount}
        />

        <PassengerManagement
          passengers={passengers}
          setPassengers={setPassengers}
          newPassenger={newPassenger}
          setNewPassenger={setNewPassenger}
          addPassenger={addPassenger}
          updatePassenger={updatePassenger}
          removePassenger={removePassenger}
          handleKeyDown={handleKeyDown}
        />

        <DocumentUploads
          passengers={passengers}
          serviceType={serviceType}
          editTrip={editTrip}
        />

        <FlightDetails serviceType={serviceType} editTrip={editTrip} />

        <DateTimeFields
          editTrip={editTrip}
          serviceType={serviceType}
          onDateTimeChange={handleDateTimeChange}
        />

        <LocationFields editTrip={editTrip} serviceType={serviceType} />

        <AmountField editTrip={editTrip} />

        <NotesField editTrip={editTrip} />

        {editTrip && <TripStatusField editTrip={editTrip} />}

        {!editTrip && (
          <RecurringTripFields
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            frequency={frequency}
            setFrequency={setFrequency}
          />
        )}

        <FormFooter onClose={onClose} isEditing={!!editTrip} />
      </form>
    </ScrollArea>
  );
}

// Helper function to parse passengers from notes (to be moved to utils)
function parsePassengers(notes: string): string[] {
  if (!notes) return [];

  // This regex looks for patterns like "Passengers: John Doe, Jane Smith"
  const passengersMatch = notes.match(/Passengers?:?\s*([^.]+)/i);

  if (passengersMatch && passengersMatch[1]) {
    return passengersMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  return [];
}
