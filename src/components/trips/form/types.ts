
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
