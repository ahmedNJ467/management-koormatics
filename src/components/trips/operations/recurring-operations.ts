
import { addDays, addMonths, addWeeks } from "date-fns";

export const createRecurringTrips = async (
  formData: FormData,
  occurrences: number,
  frequency: "daily" | "weekly" | "monthly"
) => {
  const baseDate = new Date(formData.get("date") as string);
  const trips = [];

  for (let i = 0; i < occurrences; i++) {
    // Calculate the date for this occurrence
    let tripDate;
    if (frequency === "daily") {
      tripDate = addDays(baseDate, i);
    } else if (frequency === "weekly") {
      tripDate = addWeeks(baseDate, i);
    } else {
      tripDate = addMonths(baseDate, i);
    }

    const needsReturnTime = ["round_trip", "security_escort", "full_day_hire"].includes(
      formData.get("service_type") as string
    );

    // Add this trip to the array
    trips.push({
      client_id: formData.get("client_id") as string,
      vehicle_id: formData.get("vehicle_id") as string,
      driver_id: formData.get("driver_id") as string,
      date: tripDate.toISOString().split("T")[0],
      time: formData.get("time") as string,
      return_time: needsReturnTime ? (formData.get("return_time") as string) : null,
      service_type: formData.get("service_type") as string,
      amount: 0, // Default amount
      pickup_location: formData.get("pickup_location") as string || null,
      dropoff_location: formData.get("dropoff_location") as string || null,
      notes: formData.get("special_notes") as string || null,
      is_recurring: true,
      // We don't set flight details or status here as they'll be set by the calling function
    });
  }

  return trips;
};
