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
import { SecurityEscortToggle } from "./form/SecurityEscortToggle";
import { formatUIServiceType } from "./form/utils";
import { parsePassengers } from "./utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [serviceType, setServiceType] = useState<UIServiceType>("");
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
  const [softSkinEnabled, setSoftSkinEnabled] = useState(false);
  const [armouredEnabled, setArmouredEnabled] = useState(false);
  const [softSkinCount, setSoftSkinCount] = useState<string>("0");
  const [armouredCount, setArmouredCount] = useState<string>("0");

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

      const softCount = Number(editTrip.soft_skin_count || 0);
      const armoured = Number(editTrip.armoured_count || 0);
      setSoftSkinEnabled(softCount > 0);
      setArmouredEnabled(armoured > 0);
      setSoftSkinCount(softCount > 0 ? softCount.toString() : "1");
      setArmouredCount(armoured > 0 ? armoured.toString() : "1");

      if (clientType === "organization") {
        // Get passengers from both dedicated passengers array and notes
        const extractedPassengers = editTrip.notes
          ? parsePassengers(editTrip.notes)
          : [];
        const arrayPassengers = Array.isArray(editTrip.passengers)
          ? editTrip.passengers
          : [];

        // Combine both sources and remove duplicates
        const allPassengers = Array.from(
          new Set([...arrayPassengers, ...extractedPassengers])
        );

        setPassengers(allPassengers.length > 0 ? allPassengers : [""]);
      } else {
        setPassengers([""]);
      }

      // Initialize security escort from editTrip data
      setHasSecurityEscort(editTrip.has_security_escort || false);
      setEscortCount(editTrip.escort_count || 1);
    } else {
      setServiceType("");
      setSelectedClientId("");
      setSelectedClientType("");
      setPassengers([""]);
      setHasSecurityEscort(false);
      setEscortCount(1);
      setSoftSkinEnabled(false);
      setArmouredEnabled(false);
      setSoftSkinCount("0");
      setArmouredCount("0");
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
        <input type="hidden" name="client_id" value={selectedClientId || ""} />
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

        {/* Vehicle requirements - editable for both new and existing trips */}
        {
          <div className="space-y-4">
            <h3 className="font-medium">Vehicle Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="soft_skin_count" className="mb-0">
                    Soft Skin Vehicles
                  </Label>
                  <Switch
                    checked={softSkinEnabled}
                    onCheckedChange={(checked) => {
                      setSoftSkinEnabled(checked);
                      if (checked) {
                        setSoftSkinCount((prev) =>
                          prev === "0" || prev === ""
                            ? "1"
                            : prev
                        );
                      } else {
                        setSoftSkinCount("0");
                      }
                    }}
                    aria-label="Toggle soft skin vehicle requirement"
                  />
                </div>
                <Input
                  id="soft_skin_count"
                  name={softSkinEnabled ? "soft_skin_count" : undefined}
                  type="number"
                  min={softSkinEnabled ? 1 : 0}
                  value={softSkinEnabled ? softSkinCount : "0"}
                  onChange={(event) => {
                    const numeric = event.target.value.replace(/[^0-9]/g, "");
                    setSoftSkinCount(numeric);
                  }}
                  disabled={!softSkinEnabled}
                  className={!softSkinEnabled ? "opacity-60" : undefined}
                />
                {!softSkinEnabled && (
                  <input type="hidden" name="soft_skin_count" value="0" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="armoured_count" className="mb-0">
                    Armoured Vehicles
                  </Label>
                  <Switch
                    checked={armouredEnabled}
                    onCheckedChange={(checked) => {
                      setArmouredEnabled(checked);
                      if (checked) {
                        setArmouredCount((prev) =>
                          prev === "0" || prev === ""
                            ? "1"
                            : prev
                        );
                      } else {
                        setArmouredCount("0");
                      }
                    }}
                    aria-label="Toggle armoured vehicle requirement"
                  />
                </div>
                <Input
                  id="armoured_count"
                  name={armouredEnabled ? "armoured_count" : undefined}
                  type="number"
                  min={armouredEnabled ? 1 : 0}
                  value={armouredEnabled ? armouredCount : "0"}
                  onChange={(event) => {
                    const numeric = event.target.value.replace(/[^0-9]/g, "");
                    setArmouredCount(numeric);
                  }}
                  disabled={!armouredEnabled}
                  className={!armouredEnabled ? "opacity-60" : undefined}
                />
                {!armouredEnabled && (
                  <input type="hidden" name="armoured_count" value="0" />
                )}
              </div>
            </div>
          </div>
        }

        <SecurityEscortToggle
          hasSecurityEscort={hasSecurityEscort}
          setHasSecurityEscort={setHasSecurityEscort}
          escortCount={escortCount}
          setEscortCount={setEscortCount}
        />

        {/* Hidden input for client_type */}
        <input type="hidden" name="client_type" value={selectedClientType} />

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

        {/* Removed AmountField to price trips in Finance workflow */}

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
