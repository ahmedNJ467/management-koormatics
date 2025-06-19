
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog, TankFill } from "@/lib/types";
import { FuelLogFormValues } from "../schemas/fuel-log-schema";

export async function getVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, registration")
    .order("make");

  if (error) throw error;
  return data;
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
  const formattedValues = {
    vehicle_id: values.vehicle_id,
    date: values.date,
    fuel_type: values.fuel_type as "petrol" | "diesel" | "cng",
    volume: Number(values.volume),
    cost: Number(values.cost),
    previous_mileage: Number(values.previous_mileage),
    current_mileage: Number(values.current_mileage),
    mileage: Number(values.mileage),
    notes: values.notes || null,
    filled_by: values.filled_by,
  };

  if (fuelLogId) {
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

    if (error) throw error;
    return { isNewRecord: false, data };
  } else {
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

    if (error) throw error;
    return { isNewRecord: true, data };
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
