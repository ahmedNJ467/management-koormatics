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

export async function getLatestMileage(
  vehicleId: string
): Promise<{ value: number; hasPrevious: boolean }> {
  if (!vehicleId) return { value: 0, hasPrevious: false };

  console.log("Fetching latest mileage for vehicle:", vehicleId);

  // Query fuel logs for this vehicle, ordered by date (most recent first)
  // Prefer ordering by date and fallback tiebreaker by created_at for stability
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("current_mileage, date, created_at")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching latest mileage:", error);
    throw error;
  }

  console.log("Latest mileage data:", data);

  // Return the current_mileage from the most recent fuel log, or 0 if no logs exist
  if (!data || data.length === 0) {
    return { value: 0, hasPrevious: false };
  }
  const latestValue = Number(data[0]?.current_mileage ?? 0) || 0;
  return { value: latestValue, hasPrevious: true };
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
      // Only petrol and diesel are supported
      return fuelType === "diesel" ? "diesel" : "petrol";
    };

    // Base values that are always included
    const baseValues = {
      vehicle_id: values.vehicle_id,
      date: values.date,
      fuel_type: mapFuelType(values.fuel_type) as "petrol" | "diesel",
      volume: Number(values.volume),
      cost: Number(values.cost),
      previous_mileage: Number(values.previous_mileage),
      current_mileage: Number(values.current_mileage),
      mileage: Number(values.mileage),
      notes: values.notes || null,
      tank_id: values.tank_id ? values.tank_id : null, // Normalize empty string to null
    };

    // Add price_per_liter if available (for future database compatibility)
    const formattedValues = {
      ...baseValues,
      ...(values.price_per_liter && {
        price_per_liter: Number(values.price_per_liter),
      }),
    };

    console.log("Formatted values:", formattedValues);

    // Guard: if a tank is selected, ensure the fuel type matches the tank's type
    if (baseValues.tank_id) {
      try {
        const { data: storage, error: storageError } = await supabase
          .from("fuel_management")
          .select("id, fuel_type")
          .eq("id", baseValues.tank_id)
          .single();
        if (storageError) throw storageError;
        if (
          storage &&
          storage.fuel_type &&
          storage.fuel_type !== baseValues.fuel_type
        ) {
          throw new Error(
            `Selected storage fuel type (${storage.fuel_type}) does not match log fuel type (${baseValues.fuel_type}).`
          );
        }
      } catch (tankCheckError) {
        console.error("Storage validation failed:", tankCheckError);
        throw tankCheckError;
      }
    }

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

export async function getFuelStorages() {
  const { data, error } = await supabase
    .from("fuel_management")
    .select("*")
    .order("fuel_type");
  if (error) throw error;
  return data;
}

export async function getFuelFills(storageId: string) {
  const { data, error } = await supabase
    .from("fuel_fills")
    .select("*")
    .eq("fuel_management_id", storageId)
    .order("fill_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addFuelFill(fill: {
  fuel_management_id: string;
  fill_date: string;
  amount: number;
  cost_per_liter?: number;
  total_cost?: number;
  supplier?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("fuel_fills")
    .insert([fill])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getStorageDispensed(storageId: string) {
  // Prefer RPC aggregate if available; otherwise fallback to client-side reduce
  try {
    const { data, error } = await supabase.rpc("get_tank_dispensed", {
      p_tank_id: storageId,
    });
    if (error) throw error;
    // data may be null if no rows
    return Number(data ?? 0);
  } catch (e) {
    // Fallback: fetch rows and reduce client-side
    const { data, error } = await supabase
      .from("fuel_logs")
      .select("volume")
      .eq("tank_id", storageId);
    if (error) throw error;
    return data?.reduce((sum, log) => sum + (log.volume || 0), 0) || 0;
  }
}

// Function to refresh tank statistics after fuel logs are updated
export async function refreshStorageStats() {
  try {
    const tanks = await getFuelStorages();
    const stats = {};

    for (const tank of tanks) {
      const fills = await getFuelFills(tank.id);
      const dispensed = await getStorageDispensed(tank.id);
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
  const event = new CustomEvent("fuelStorageDataUpdate", {
    detail: { timestamp: Date.now() },
  });
  window.dispatchEvent(event);
}
