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

  const uiServiceType = formData.get("service_type") as string;

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
  const stops = rawStops
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

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
  const softSkinCount = parseInt(formData.get("soft_skin_count") as string) || 0;
  const armouredCount = parseInt(formData.get("armoured_count") as string) || 0;

  // Sanitize vehicle_type – convert empty string to null so Postgres enum isn't violated
  const vehicleTypeField = formData.get("vehicle_type") as string | null;
  const vehicleType =
    vehicleTypeField === "armoured" || vehicleTypeField === "soft_skin"
      ? (vehicleTypeField as "armoured" | "soft_skin")
      : null;

  // Get security escort fields
  console.log("FormData security escort values:", {
    has_security_escort: formData.get("has_security_escort"),
    escort_count: formData.get("escort_count"),
  });

  const hasSecurityEscort = formData.get("has_security_escort") === "true";
  const escortCount = hasSecurityEscort
    ? parseInt(formData.get("escort_count") as string) || 1
    : 0;

  console.log("Saving trip with client type:", clientType);
  console.log("Saving trip with passengers:", passengers);
  console.log("Saving trip with stops:", stops);
  console.log(
    "Saving trip with security escort:",
    hasSecurityEscort,
    "count:",
    escortCount
  );

  try {
    if (editTrip) {
      const { error } = await supabase
        .from("trips")
        .update({
          client_id: formData.get("client_id") as string,
          date: formData.get("date") as string,
          time: timeValue || null,
          return_time: needsReturnTime ? returnTimeValue || null : null,
          service_type: dbServiceType,
          pickup_location: (formData.get("pickup_location") as string) || null,
          dropoff_location:
            (formData.get("dropoff_location") as string) || null,
          notes: notes || null,
          status: statusValue,
          flight_number: flightNumber,
          airline: airline,
          terminal: terminal,
          passengers: passengers.length > 0 ? passengers : null,
          amount: amount,
          vehicle_type: vehicleType,
          passport_documents:
            passportDocuments.length > 0 ? passportDocuments : null,
          invitation_documents:
            invitationDocuments.length > 0 ? invitationDocuments : null,
          has_security_escort: hasSecurityEscort,
          escort_count: escortCount,
          soft_skin_count: softSkinCount,
          armoured_count: armouredCount,
          stops: stops.length > 0 ? stops : null,
        })
        .eq("id", editTrip.id);

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
        .insert(trips)
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
      const tripData = {
        client_id: formData.get("client_id") as string,
        date: formData.get("date") as string,
        time: timeValue || null,
        return_time: needsReturnTime ? returnTimeValue || null : null,
        service_type: dbServiceType,
        amount: amount,
        pickup_location: (formData.get("pickup_location") as string) || null,
        dropoff_location: (formData.get("dropoff_location") as string) || null,
        notes: notes || null,
        status: "scheduled" as any,
        flight_number: flightNumber,
        airline: airline,
        terminal: terminal,
        passengers: passengers.length > 0 ? passengers : null,
        passport_documents:
          passportDocuments.length > 0 ? passportDocuments : null,
        invitation_documents:
          invitationDocuments.length > 0 ? invitationDocuments : null,
        vehicle_type: vehicleType,
        driver_id: null,
        vehicle_id: null,
        has_security_escort: hasSecurityEscort,
        escort_count: escortCount,
        soft_skin_count: softSkinCount,
        armoured_count: armouredCount,
        stops: stops.length > 0 ? stops : null,
      };

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
      description: "Failed to save trip details",
      variant: "destructive",
    });
  }
};
