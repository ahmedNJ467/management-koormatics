
// Re-export all types and utilities from the split files
export * from './base-types';
export * from './communication';
export * from './trip-data';
export * from './trip-utils';
// Make sure extractFlightInfo is exported
export { extractFlightInfo } from "@/components/trips/utils";
