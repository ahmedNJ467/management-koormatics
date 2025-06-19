import { z } from "zod";

export const fuelLogSchema = z
  .object({
    vehicle_id: z.string().min(1, "Vehicle is required"),
    date: z.string().min(1, "Date is required"),
    fuel_type: z.enum(["petrol", "diesel", "cng"]),
    volume: z.number().min(0.01, "Volume must be greater than 0"),
    price_per_liter: z
      .number()
      .min(0.01, "Price per liter must be greater than 0"),
    cost: z.number().min(0.01, "Cost must be greater than 0"),
    previous_mileage: z
      .number()
      .min(0, "Previous mileage must be a positive number"),
    current_mileage: z
      .number()
      .min(0, "Current mileage must be a positive number"),
    mileage: z.number().min(0, "Mileage must be a positive number"),
    notes: z.string().optional(),
    filled_by: z
      .string()
      .min(1, "Name of person who filled the fuel is required"),
    tank_id: z.string().uuid().optional(),
  })
  .refine((data) => data.current_mileage >= data.previous_mileage, {
    message:
      "Current mileage must be greater than or equal to previous mileage",
    path: ["current_mileage"],
  });

export type FuelLogFormValues = z.infer<typeof fuelLogSchema>;
