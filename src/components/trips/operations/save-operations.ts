import { supabase } from "@/integrations/supabase/client";
import {
  DisplayTrip,
  TripStatus,
  TripType,
  DbServiceType,
} from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";
import {
  serviceTypeMap,
  mapTripTypeToDbServiceType,
} from "./service-type-mapping";
import { createRecurringTrips } from "./recurring-operations";
import { logActivity } from "@/utils/activity-logger";
import { format } from "date-fns";

export const handleSaveTrip = async (
  event: React.FormEvent<HTMLFormElement>,
  editTrip: DisplayTrip | null,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setBookingOpen: (open: boolean) => void,
  toast: (props: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const uiServiceType = (formData.get("service_type") as string) || "one_way";

  const tripType: TripType = (serviceTypeMap[uiServiceType] ||
    "other") as TripType;
  const dbServiceType: DbServiceType = mapTripTypeToDbServiceType(tripType);
  const isRecurringChecked = formData.get("is_recurring") === "on";

  const timeValue = formData.get("time") as string;
  const returnTimeValue = formData.get("return_time") as string;
  const needsReturnTime = ["round_trip", "full_day_hire"].includes(
    uiServiceType
  );

  const flightNumber =
    uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff"
      ? (formData.get("flight_number") as string)
      : null;

  const airline =
    uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff"
      ? (formData.get("airline") as string)
      : null;

  const terminal =
    uiServiceType === "airport_pickup" || uiServiceType === "airport_dropoff"
      ? (formData.get("terminal") as string)
      : null;

  const notes = (formData.get("special_notes") as string) || "";

  const statusValue = (formData.get("status") as TripStatus) || "scheduled";

  const clientType = formData.get("client_type") as string;

  let passengers: string[] = [];
  const passengersValue = formData.get("passengers");

  if (passengersValue) {
    try {
      passengers = JSON.parse(passengersValue as string);
    } catch (error) {
      console.error("Error parsing passengers:", error);
      if (typeof passengersValue === "string") {
        passengers = passengersValue
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
      }
    }
  }

  // Parse document uploads
  let passportDocuments: any[] = [];
  let invitationDocuments: any[] = [];

  const passportDocsValue = formData.get("passport_documents");
  const invitationDocsValue = formData.get("invitation_documents");

  // Parse intermediate stops (array of strings). Inputs are named stops[]
  const rawStops = formData.getAll("stops[]") as string[];
  const stops = rawStops.map((s) => s.trim()).filter((s) => s.length > 0);

  if (passportDocsValue) {
    try {
      passportDocuments = JSON.parse(passportDocsValue as string);
    } catch (error) {
      console.error("Error parsing passport documents:", error);
    }
  }

  if (invitationDocsValue) {
    try {
      invitationDocuments = JSON.parse(invitationDocsValue as string);
    } catch (error) {
      console.error("Error parsing invitation documents:", error);
    }
  }

  const amountValue = formData.get("amount") as string;
  const amount = amountValue ? parseFloat(amountValue) : 0;

  // Parse vehicle count inputs
  const softSkinCount =
    parseInt(formData.get("soft_skin_count") as string) || 0;
  const armouredCount = parseInt(formData.get("armoured_count") as string) || 0;

  // Sanitize vehicle_type – convert empty string to null so Postgres enum isn't violated
  const vehicleTypeField = formData.get("vehicle_type") as string | null;
  const vehicleType =
    vehicleTypeField === "armoured" || vehicleTypeField === "soft_skin"
      ? (vehicleTypeField as "armoured" | "soft_skin")
      : null;

  // Get security escort fields
  const hasSecurityEscort = formData.get("has_security_escort") === "true";
  const escortCount = hasSecurityEscort
    ? parseInt(formData.get("escort_count") as string) || 1
    : 0;

  try {
    // Basic validation for required fields
    const clientId = (formData.get("client_id") as string) || "";
    const dateField = (formData.get("date") as string) || "";
    if (!clientId) {
      toast({
        title: "Missing client",
        description: "Please select a client before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!dateField) {
      toast({
        title: "Missing date",
        description: "Please select a trip date before saving.",
        variant: "destructive",
      });
      return;
    }
    if (editTrip) {
      const baseUpdate: any = {
        client_id: clientId,
        date: dateField,
        service_type: dbServiceType,
        amount: amount,
        status: statusValue,
      };
      if (timeValue) baseUpdate.time = timeValue;
      if (needsReturnTime && returnTimeValue)
        baseUpdate.return_time = returnTimeValue;
      const pickup = (formData.get("pickup_location") as string) || "";
      const dropoff = (formData.get("dropoff_location") as string) || "";
      if (pickup) baseUpdate.pickup_location = pickup;
      if (dropoff) baseUpdate.dropoff_location = dropoff;
      if (notes) baseUpdate.notes = notes;
      if (flightNumber) baseUpdate.flight_number = flightNumber;
      if (airline) baseUpdate.airline = airline;
      if (terminal) baseUpdate.terminal = terminal;
      if (passengers.length > 0) baseUpdate.passengers = passengers;
      if (vehicleType) baseUpdate.vehicle_type = vehicleType;
      if (passportDocuments.length > 0)
        baseUpdate.passport_documents = passportDocuments;
      if (invitationDocuments.length > 0)
        baseUpdate.invitation_documents = invitationDocuments;
      // Escort fields: always set boolean; set count only when enabled, otherwise null
      baseUpdate.has_security_escort = hasSecurityEscort;
      baseUpdate.escort_count = hasSecurityEscort
        ? Math.max(1, escortCount || 1)
        : (null as any);
      baseUpdate.soft_skin_count = softSkinCount;
      baseUpdate.armoured_count = armouredCount;
      if (stops.length > 0) baseUpdate.stops = stops;

      const { error } = await supabase
        .from("trips")
        .update(baseUpdate as any)
        .eq("id", editTrip.id as any);

      if (error) throw error;

      // Log the activity after successful update
      await logActivity({
        title: `Trip updated: ${formData.get("pickup_location") || ""} to ${
          formData.get("dropoff_location") || ""
        }`,
        type: "trip",
        relatedId: editTrip.id,
      });

      toast({
        title: "Trip updated",
        description: "Trip details have been updated successfully",
      });

      setEditTrip(null);
    } else if (isRecurringChecked) {
      const occurrences = parseInt(formData.get("occurrences") as string) || 1;
      const frequencyValue = formData.get("frequency") as
        | "daily"
        | "weekly"
        | "monthly";

      const trips = await createRecurringTrips(
        formData,
        occurrences,
        frequencyValue
      );

      trips.forEach((trip: any) => {
        trip.flight_number = flightNumber;
        trip.airline = airline;
        trip.terminal = terminal;
        trip.status = "scheduled";
        trip.passengers = passengers.length > 0 ? passengers : null;
        trip.amount = amount;
        trip.passport_documents =
          passportDocuments.length > 0 ? passportDocuments : null;
        trip.invitation_documents =
          invitationDocuments.length > 0 ? invitationDocuments : null;
        trip.vehicle_type = vehicleType;
        trip.driver_id = null;
        trip.vehicle_id = null;
        trip.time = timeValue || null;
        trip.return_time = needsReturnTime ? returnTimeValue || null : null;
        trip.has_security_escort = hasSecurityEscort;
        trip.escort_count = escortCount;
        trip.soft_skin_count = softSkinCount;
        trip.armoured_count = armouredCount;
        trip.stops = stops.length > 0 ? stops : null;
      });

      const { data, error } = await supabase
        .from("trips")
        .insert(trips as any)
        .select("id");

      if (error) throw error;

      // Log activity for recurring trips
      if (data && data.length > 0) {
        await logActivity({
          title: `${trips.length} recurring trips created`,
          type: "trip",
          relatedId: data[0].id,
        });
      }

      toast({
        title: "Recurring trips created",
        description: `${trips.length} trips have been scheduled successfully`,
      });

      setBookingOpen(false);
    } else {
      const tripData: any = {
        client_id: clientId,
        date: dateField,
        service_type: dbServiceType,
        amount,
        status: "scheduled" as any,
        driver_id: null,
        vehicle_id: null,
      };
      if (timeValue) tripData.time = timeValue;
      if (needsReturnTime && returnTimeValue)
        tripData.return_time = returnTimeValue;
      const pickup = (formData.get("pickup_location") as string) || "";
      const dropoff = (formData.get("dropoff_location") as string) || "";
      if (pickup) tripData.pickup_location = pickup;
      if (dropoff) tripData.dropoff_location = dropoff;
      if (notes) tripData.notes = notes;
      if (flightNumber) tripData.flight_number = flightNumber;
      if (airline) tripData.airline = airline;
      if (terminal) tripData.terminal = terminal;
      if (passengers.length > 0) tripData.passengers = passengers;
      if (passportDocuments.length > 0)
        tripData.passport_documents = passportDocuments;
      if (invitationDocuments.length > 0)
        tripData.invitation_documents = invitationDocuments;
      if (vehicleType) tripData.vehicle_type = vehicleType;
      // Escort fields: always set boolean; set count only when enabled, otherwise null
      tripData.has_security_escort = hasSecurityEscort;
      tripData.escort_count = hasSecurityEscort
        ? Math.max(1, escortCount || 1)
        : (null as any);
      tripData.soft_skin_count = softSkinCount;
      tripData.armoured_count = armouredCount;
      if (stops.length > 0) tripData.stops = stops;

      const { data, error } = await supabase
        .from("trips")
        .insert(tripData)
        .select("id")
        .single();

      if (error) {
        console.error("Error creating trip:", error);
        throw error;
      }

      // Log activity for new trip
      if (data) {
        await logActivity({
          title: `New trip created: ${
            formData.get("pickup_location") || ""
          } to ${formData.get("dropoff_location") || ""}`,
          type: "trip",
          relatedId: data.id,
        });
      }

      toast({
        title: "Trip created",
        description: "New trip has been booked successfully",
      });

      setBookingOpen(false);
    }

    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  } catch (error) {
    console.error("Error saving trip:", error);
    toast({
      title: "Error",
      description: (error as any)?.message || "Failed to save trip details",
      variant: "destructive",
    });
  }
};
