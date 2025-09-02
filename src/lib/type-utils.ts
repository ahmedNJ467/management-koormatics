// Type utilities to help resolve database type mismatches

/**
 * Safely asserts that a value is an array, returning an empty array if undefined/null
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value || [];
}

/**
 * Safely asserts that a value is not null/undefined, with fallback
 */
export function ensureValue<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Type guard to check if a value is a valid database result
 */
export function isValidResult<T>(value: any): value is T {
  return value && typeof value === 'object' && !('error' in value);
}

/**
 * Safely extracts database results with proper type assertion
 */
export function extractData<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  return [];
}

/**
 * Safely extracts a single database result
 */
export function extractSingle<T>(data: any): T | null {
  if (data && typeof data === 'object' && !('error' in data)) {
    return data as T;
  }
  return null;
}

/**
 * Type-safe database update payload
 */
export function createUpdatePayload<T extends Record<string, any>>(
  updates: Partial<T>
): Partial<T> {
  return updates;
}

/**
 * Type-safe database insert payload
 */
export function createInsertPayload<T extends Record<string, any>>(
  data: T
): T {
  return data;
}
