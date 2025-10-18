
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "../schemas/fuel-log-schema";

export function useFuelCalculations(form: UseFormReturn<FuelLogFormValues>) {
  const volume = form.watch("volume");
  const pricePerLiter = form.watch("price_per_liter");
  const previousMileage = form.watch("previous_mileage");
  const currentMileage = form.watch("current_mileage");

  // Calculate total cost based on volume and price per liter
  useEffect(() => {
    if (volume && pricePerLiter) {
      const calculatedCost = volume * pricePerLiter;
      form.setValue("cost", Number(calculatedCost.toFixed(2)));
    } else {
      form.setValue("cost", 0);
    }
  }, [volume, pricePerLiter, form]);

  // Calculate distance based on current and previous mileage
  useEffect(() => {
    if (currentMileage >= 0 && previousMileage >= 0) {
      const distance = Math.max(0, currentMileage - previousMileage);
      form.setValue("mileage", distance);
    } else {
      form.setValue("mileage", 0);
    }
  }, [currentMileage, previousMileage, form]);

  return {
    volume,
    pricePerLiter,
    previousMileage,
    currentMileage,
  };
}
