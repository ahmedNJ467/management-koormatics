// Main types index - single source of truth for all application types

// Core entity types
export * from "./driver";
export * from "./maintenance";
// Note: vehicle.ts and fuel-log.ts both export FuelType, so we handle them separately
export type {
  FuelType as VehicleFuelType,
  Vehicle,
  VehicleType,
  VehicleStatus,
} from "./vehicle";
export * from "./fuel-log";
// Note: fuel.ts exports are handled separately to avoid conflicts
export type { TankFill, Tank, TankStats } from "./fuel";
export * from "./quotation";
export * from "./client";

// Trip types (complex structure)
export * from "./trip";

// Business logic types
export * from "./invoice";
export * from "./cost-analytics";
export * from "./interest-point";
