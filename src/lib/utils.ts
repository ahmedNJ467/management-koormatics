
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVehicleId(uuid: string): string {
  // Take first 3 digits of UUID and format as V001, V002, etc.
  const numericPart = parseInt(uuid.slice(0, 3), 16) % 1000;
  return `V${numericPart.toString().padStart(3, '0')}`;
}
