/**
 * Date utility functions for safe date handling across the dashboard
 */

/**
 * Safely parse a date string and return a valid Date object or null
 */
export function safeParseDate(dateString: any): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return null;
  }
}

/**
 * Format a date string for display, with fallback for invalid dates
 */
export function formatDate(dateString: any, options?: Intl.DateTimeFormatOptions): string {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Date";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };
  
  return date.toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format a date string for time display
 */
export function formatTime(dateString: any): string {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Time";
  
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get month name from date string
 */
export function getMonthName(dateString: any): string {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Month";
  
  return date.toLocaleString("default", { month: "short" });
}

/**
 * Check if a date is within a specific year
 */
export function isDateInYear(dateString: any, year: string): boolean {
  const date = safeParseDate(dateString);
  if (!date) return false;
  
  return date.getFullYear().toString() === year;
}

/**
 * Check if a date is within a specific month
 */
export function isDateInMonth(dateString: any, monthName: string): boolean {
  const date = safeParseDate(dateString);
  if (!date) return false;
  
  const dateMonth = date.toLocaleString("default", { month: "short" });
  return dateMonth === monthName;
}

/**
 * Create a date from date and time strings
 */
export function createDateTime(dateString: any, timeString: any): Date | null {
  if (!dateString || !timeString) return null;
  
  try {
    // Handle different date formats
    let date: Date;
    if (typeof dateString === 'string' && dateString.includes('T')) {
      // Already a full datetime string
      date = new Date(dateString);
    } else {
      // Combine date and time
      const combined = `${dateString}T${timeString}`;
      date = new Date(combined);
    }
    
    if (isNaN(date.getTime())) {
      console.warn("Invalid combined date/time:", dateString, timeString);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn("Error creating datetime:", dateString, timeString, error);
    return null;
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: any): string {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Date";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: any, endDate: any): boolean {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  
  if (!start || !end) return false;
  
  return start <= end;
}
