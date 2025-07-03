import { supabase } from "@/integrations/supabase/client";
import type { FuelLog, TankFill } from "@/lib/types";
import { FuelLogFormValues } from "../schemas/fuel-log-schema";

export async function getVehicles() {
  try {
    // First try to get vehicles with fuel_type
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, make, model, registration, fuel_type")
      .order("make");

    if (error) {
      // If error is about fuel_type column not existing, try without it
      if (error.message?.includes("fuel_type") || error.code === "42703") {
        console.log("fuel_type column not found, fetching vehicles without it");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("vehicles")
          .select("id, make, model, registration")
          .order("make");

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw error;
  }
}

export async function getLatestMileage(vehicleId: string) {
  if (!vehicleId) return 0;

  console.log("Fetching latest mileage for vehicle:", vehicleId);

  // Query fuel logs for this vehicle, ordered by date (most recent first)
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("current_mileage")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching latest mileage:", error);
    throw error;
  }

  console.log("Latest mileage data:", data);

  // Return the current_mileage from the most recent fuel log, or 0 if no logs exist
  if (!data || data.length === 0) return 0;
  return data[0]?.current_mileage || 0;
}

export async function getFuelLogById(fuelLogId: string) {
  const { data, error } = await supabase
    .from("fuel_logs")
    .select(
      `
      *,
      vehicle:vehicles (
        make,
        model,
        registration
      )
    `
    )
    .eq("id", fuelLogId)
    .single();

  if (error) throw error;
  return data as FuelLog;
}

export async function saveFuelLog(
  values: FuelLogFormValues,
  fuelLogId?: string
) {
  try {
    console.log("Saving fuel log with values:", values);

    // Map fuel types to ensure compatibility with database
    const mapFuelType = (fuelType: string) => {
      // If hybrid or electric, fall back to petrol for now until DB is updated
      if (fuelType === "hybrid" || fuelType === "electric") {
        console.warn(
          `Fuel type '${fuelType}' not supported in database, using 'petrol' as fallback`
        );
        return "petrol";
      }
      return fuelType;
    };

    const formattedValues = {
      vehicle_id: values.vehicle_id,
      date: values.date,
      fuel_type: mapFuelType(values.fuel_type) as "petrol" | "diesel" | "cng",
      volume: Number(values.volume),
      cost: Number(values.cost),
      previous_mileage: Number(values.previous_mileage),
      current_mileage: Number(values.current_mileage),
      mileage: Number(values.mileage),
      notes: values.notes || null,
      tank_id: values.tank_id || null, // Include tank_id for automatic deduction
    };

    console.log("Formatted values:", formattedValues);

    if (fuelLogId) {
      console.log("Updating existing fuel log:", fuelLogId);
      const { data, error } = await supabase
        .from("fuel_logs")
        .update(formattedValues as any)
        .eq("id", fuelLogId)
        .select(
          `
          *,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `
        )
        .single();

      if (error) {
        console.error("Update fuel log error:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log("Fuel log updated successfully:", data);

      // Refresh tank stats and broadcast update if tank is linked
      if (values.tank_id) {
        console.log("Refreshing tank stats after fuel log update");
        broadcastTankUpdate();
      }

      return { isNewRecord: false, data };
    } else {
      console.log("Creating new fuel log");
      const { data, error } = await supabase
        .from("fuel_logs")
        .insert(formattedValues as any)
        .select(
          `
          *,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `
        )
        .single();

      if (error) {
        console.error("Insert fuel log error:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log("Fuel log created successfully:", data);

      // Refresh tank stats and broadcast update if tank is linked
      if (values.tank_id) {
        console.log("Refreshing tank stats after fuel log creation");
        broadcastTankUpdate();
      }

      return { isNewRecord: true, data };
    }
  } catch (error) {
    console.error("saveFuelLog error:", error);
    throw error;
  }
}

export async function getFuelTanks() {
  const { data, error } = await supabase
    .from("fuel_tanks")
    .select("*")
    .order("fuel_type");
  if (error) throw error;
  return data;
}

export async function getTankFills(tankId: string) {
  const { data, error } = await supabase
    .from("tank_fills")
    .select("*")
    .eq("tank_id", tankId)
    .order("fill_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addTankFill(fill: {
  tank_id: string;
  fill_date: string;
  amount: number;
  cost_per_liter?: number;
  total_cost?: number;
  supplier?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("tank_fills")
    .insert([fill])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getTankDispensed(tankId: string) {
  // Sum of all fuel dispensed from this tank (from fuel_logs)
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("volume")
    .eq("tank_id", tankId);
  if (error) throw error;
  return data?.reduce((sum, log) => sum + (log.volume || 0), 0) || 0;
}

// Function to refresh tank statistics after fuel logs are updated
export async function refreshTankStats() {
  try {
    const tanks = await getFuelTanks();
    const stats = {};

    for (const tank of tanks) {
      const fills = await getTankFills(tank.id);
      const dispensed = await getTankDispensed(tank.id);
      const totalFilled = fills.reduce((sum, f) => sum + (f.amount || 0), 0);
      const lastFill = fills[0];

      stats[tank.id] = {
        currentLevel: totalFilled - dispensed,
        lastFillDate: lastFill?.fill_date,
        lastFillAmount: lastFill?.amount,
        totalFilled,
        totalDispensed: dispensed,
      };
    }

    return { tanks, stats };
  } catch (error) {
    console.error("Error refreshing tank stats:", error);
    throw error;
  }
}

// Broadcast tank update event
export function broadcastTankUpdate() {
  // Create a custom event to notify components that tank data should be refreshed
  const event = new CustomEvent("tankDataUpdate", {
    detail: { timestamp: Date.now() },
  });
  window.dispatchEvent(event);
}
