// Type guards for safely handling Supabase query results

/**
 * Type guard to check if a value is a Supabase error
 */
export function isSupabaseError(value: any): value is { error: true; message: string } {
  return value && typeof value === 'object' && 'error' in value && value.error === true;
}

/**
 * Type guard to check if a value is a valid array result
 */
export function isValidArrayResult<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0 && !isSupabaseError(value[0]);
}

/**
 * Type guard to check if a value is a valid single result
 */
export function isValidSingleResult<T>(value: any): value is T {
  return value && typeof value === 'object' && !isSupabaseError(value);
}

/**
 * Safe array result handler that filters out errors
 */
export function safeArrayResult<T>(value: any): T[] {
  if (!Array.isArray(value)) return [];
  
  // Filter out any error objects
  const validResults = value.filter(item => !isSupabaseError(item));
  return validResults as T[];
}

/**
 * Safe single result handler
 */
export function safeSingleResult<T>(value: any): T | null {
  if (isSupabaseError(value)) return null;
  return value as T;
}

/**
 * Type guard for checking if a value has required properties
 */
export function hasRequiredProperties<T extends Record<string, any>>(
  value: any, 
  requiredKeys: (keyof T)[]
): value is T {
  if (!value || typeof value !== 'object') return false;
  
  return requiredKeys.every(key => key in value);
}

/**
 * Type guard for checking if a value is a valid ID
 */
export function isValidId(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}
