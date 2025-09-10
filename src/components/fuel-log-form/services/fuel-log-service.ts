import { supabase } from "@/integrations/supabase/client";
import type { FuelLog, StorageFill } from "@/lib/types";
import { FuelLogFormValues } from "../schemas/fuel-log-schema";
import { ensureArray, extractData } from "@/lib/type-utils";

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
    .eq("vehicle_id", vehicleId as any)
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
  const latestValue = Number((data[0] as any)?.current_mileage ?? 0) || 0;
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
    .eq("id", fuelLogId as any)
    .single();

  if (error) throw error;
  return data as any;
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
      filled_by: values.filled_by || null,
      fuel_management_id: values.fuel_management_id
        ? values.fuel_management_id
        : null, // Normalize empty string to null
    };

    // Add price_per_liter if available (for future database compatibility)
    const formattedValues = {
      ...baseValues,
      ...(values.price_per_liter && {
        price_per_liter: Number(values.price_per_liter),
      }),
    };

    console.log("Formatted values:", formattedValues);

    // Guard: if a storage is selected, ensure the fuel type matches the storage's type
    if (baseValues.fuel_management_id) {
      try {
        const { data: storage, error: storageError } = await supabase
          .from("fuel_management")
          .select("id, fuel_type")
          .eq("id", baseValues.fuel_management_id as any)
          .single();
        if (storageError) throw storageError;
        if (
          storage &&
          (storage as any).fuel_type &&
          (storage as any).fuel_type !== baseValues.fuel_type
        ) {
          throw new Error(
            `Selected storage fuel type (${
              (storage as any).fuel_type
            }) does not match log fuel type (${baseValues.fuel_type}).`
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
        .eq("id", fuelLogId as any)
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

      // Refresh storage stats and broadcast update if storage is linked
      if (values.fuel_management_id) {
        console.log("Refreshing storage stats after fuel log update");
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

      // Refresh storage stats and broadcast update if storage is linked
      if (values.fuel_management_id) {
        console.log("Refreshing storage stats after fuel log creation");
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
  try {
    const { data, error } = await supabase
      .from("fuel_management")
      .select("*")
      .order("fuel_type");

    if (error) {
      console.error("Supabase error in getFuelStorages:", error);
      throw error;
    }

    return ensureArray(data);
  } catch (error) {
    console.error("Exception in getFuelStorages:", error);
    throw error;
  }
}

export async function getFuelFills(storageId: string) {
  try {
    const { data, error } = await supabase
      .from("fuel_fills")
      .select("*")
      .eq("fuel_management_id", storageId as any)
      .order("fill_date", { ascending: false });

    if (error) {
      console.error(`Supabase error in getFuelFills for ${storageId}:`, error);
      throw error;
    }

    return ensureArray(data);
  } catch (error) {
    console.error(`Exception in getFuelFills for ${storageId}:`, error);
    throw error;
  }
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
    .insert([fill] as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function getStorageDispensed(storageId: string) {
  // Fetch rows and reduce client-side since the RPC function expects tank_id which doesn't exist in the current schema
  try {
    const { data, error } = await supabase
      .from("fuel_logs")
      .select("volume")
      .eq("fuel_management_id", storageId as any);

    if (error) {
      console.error(`Error in getStorageDispensed for ${storageId}:`, error);
      throw error;
    }

    return data?.reduce((sum, log) => sum + ((log as any).volume || 0), 0) || 0;
  } catch (error) {
    console.error(`Error in getStorageDispensed for ${storageId}:`, error);
    throw error;
  }
}

// Function to refresh tank statistics after fuel logs are updated
export async function refreshStorageStats() {
  try {
    const tanks = await getFuelStorages();
    const stats: any = {};

    for (const tank of tanks) {
      const fills = await getFuelFills((tank as any).id);
      const dispensed = await getStorageDispensed((tank as any).id);
      const totalFilled = fills.reduce(
        (sum, f) => sum + ((f as any).amount || 0),
        0
      );
      const lastFill = fills[0];

      stats[(tank as any).id] = {
        currentLevel: totalFilled - dispensed,
        lastFillDate: (lastFill as any)?.fill_date,
        lastFillAmount: (lastFill as any)?.amount,
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
