/**
 * Database Query Optimization Utilities
 * Best practices for Supabase queries
 */

import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Optimize query by selecting only needed fields
 */
export function selectFields<T>(
  query: PostgrestFilterBuilder<any, T, any>,
  fields: string[]
): PostgrestFilterBuilder<any, T, any> {
  return query.select(fields.join(", "));
}

/**
 * Add pagination to query
 */
export function withPagination<T>(
  query: PostgrestFilterBuilder<any, T, any>,
  page: number,
  pageSize: number
): PostgrestFilterBuilder<any, T, any> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

/**
 * Common query patterns with optimizations
 */
export const queryPatterns = {
  /**
   * Get single item by ID (optimized)
   */
  getById: <T>(
    query: PostgrestFilterBuilder<any, T, any>,
    id: string,
    fields?: string[]
  ) => {
    let q = query.eq("id", id);
    if (fields) {
      q = selectFields(q, fields);
    }
    return q.maybeSingle();
  },

  /**
   * Get list with pagination (optimized)
   */
  getList: <T>(
    query: PostgrestFilterBuilder<any, T, any>,
    options?: {
      page?: number;
      pageSize?: number;
      fields?: string[];
      orderBy?: string;
      orderDirection?: "asc" | "desc";
      filters?: Record<string, any>;
    }
  ) => {
    let q = query;
    
    // Select only needed fields
    if (options?.fields) {
      q = selectFields(q, options.fields);
    }
    
    // Apply filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          q = q.eq(key, value);
        }
      });
    }
    
    // Apply ordering
    if (options?.orderBy) {
      q = q.order(options.orderBy, {
        ascending: options.orderDirection !== "desc",
      });
    }
    
    // Apply pagination
    if (options?.page && options?.pageSize) {
      q = withPagination(q, options.page, options.pageSize);
    }
    
    return q;
  },

  /**
   * Count records (optimized)
   */
  getCount: <T>(
    query: PostgrestFilterBuilder<any, T, any>,
    filters?: Record<string, any>
  ) => {
    let q = query.select("id", { count: "exact", head: true });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          q = q.eq(key, value);
        }
      });
    }
    
    return q;
  },
};

/**
 * Recommended database indexes
 * Add these to your Supabase database for better performance
 */
export const recommendedIndexes = `
-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON trips(client_id);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- Fuel logs table indexes
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_type ON fuel_logs(fuel_type);

-- Maintenance table indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance(date);

-- Drivers table indexes
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry);

-- Incident reports table indexes
CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_id ON vehicle_incident_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON vehicle_incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON vehicle_incident_reports(incident_date);
`;

