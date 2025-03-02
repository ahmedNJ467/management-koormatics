
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog } from "@/lib/types";
import { FuelLogFormValues } from "../schemas/fuel-log-schema";

export async function getVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, make, model, registration')
    .order('make');
  
  if (error) throw error;
  return data;
}

export async function getLatestMileage(vehicleId: string) {
  if (!vehicleId) return 0;
  
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('current_mileage')
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false })
    .limit(1);
  
  if (error || !data || data.length === 0) return 0;
  return data[0]?.current_mileage || 0;
}

export async function saveFuelLog(values: FuelLogFormValues, fuelLogId?: string) {
  const formattedValues = {
    vehicle_id: values.vehicle_id,
    date: values.date,
    fuel_type: values.fuel_type as "petrol" | "diesel" | "cng",
    volume: Number(values.volume),
    cost: Number(values.cost),
    previous_mileage: Number(values.previous_mileage),
    current_mileage: Number(values.current_mileage),
    mileage: Number(values.mileage),
    notes: values.notes || null
  };

  if (fuelLogId) {
    const { error } = await supabase
      .from("fuel_logs")
      .update(formattedValues as any)
      .eq("id", fuelLogId);

    if (error) throw error;
    return { isNewRecord: false };
  } else {
    const { error } = await supabase
      .from("fuel_logs")
      .insert(formattedValues as any);

    if (error) throw error;
    return { isNewRecord: true };
  }
}
