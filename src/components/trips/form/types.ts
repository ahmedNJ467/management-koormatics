
import { DisplayTrip } from "@/lib/types/trip";
import { Client, Driver, Vehicle } from "@/lib/types";

export type UIServiceType = "airport_pickup" | "airport_dropoff" | "round_trip" | "security_escort" | "one_way" | "full_day_hire";

export interface TripFormProps {
  editTrip: DisplayTrip | null;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export interface PassengerManagementProps {
  passengers: string[];
  setPassengers: (passengers: string[]) => void;
  newPassenger: string;
  setNewPassenger: (value: string) => void;
  addPassenger: () => void;
  updatePassenger: (index: number, value: string) => void;
  removePassenger: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface FlightDetailsProps {
  serviceType: UIServiceType;
  editTrip: DisplayTrip | null;
}

export interface RecurringTripProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  frequency: "daily" | "weekly" | "monthly";
  setFrequency: (value: "daily" | "weekly" | "monthly") => void;
}
