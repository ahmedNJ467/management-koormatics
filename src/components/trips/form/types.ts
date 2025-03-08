
import { Client, Driver, Vehicle } from "@/lib/types";
import { DisplayTrip } from "@/lib/types/trip";

export type UIServiceType = 
  | "airport_pickup" 
  | "airport_dropoff" 
  | "one_way" 
  | "round_trip" 
  | "full_day_hire" 
  | "security_escort";

export interface TripFormProps {
  editTrip: DisplayTrip | null;
  clients?: Client[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  trips?: DisplayTrip[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export interface FlightDetailsProps {
  serviceType: UIServiceType;
  editTrip: DisplayTrip | null;
}

export interface PassengerManagementProps {
  passengers: string[];
  setPassengers?: React.Dispatch<React.SetStateAction<string[]>>;
  newPassenger: string;
  setNewPassenger: React.Dispatch<React.SetStateAction<string>>;
  addPassenger: () => void;
  updatePassenger: (index: number, value: string) => void;
  removePassenger: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface RecurringTripProps {
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  frequency: "daily" | "weekly" | "monthly";
  setFrequency: (frequency: "daily" | "weekly" | "monthly") => void;
}
