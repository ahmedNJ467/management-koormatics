/**
 * Trip Performance Utilities
 * Functions to calculate on-time performance and other trip metrics
 */

export interface TripTimeData {
  scheduledPickupTime?: string;
  scheduledReturnTime?: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
  date: string;
}

export interface OnTimeMetrics {
  isPickupOnTime: boolean;
  isReturnOnTime: boolean;
  pickupDelayMinutes: number;
  returnDelayMinutes: number;
  overallOnTime: boolean;
}

/**
 * Calculate on-time performance for a trip
 */
export function calculateOnTimePerformance(
  tripData: TripTimeData
): OnTimeMetrics {
  const {
    scheduledPickupTime,
    scheduledReturnTime,
    actualPickupTime,
    actualDropoffTime,
    date,
  } = tripData;

  let isPickupOnTime = true;
  let isReturnOnTime = true;
  let pickupDelayMinutes = 0;
  let returnDelayMinutes = 0;

  // Calculate pickup on-time performance
  if (scheduledPickupTime && actualPickupTime) {
    const scheduledDateTime = new Date(`${date}T${scheduledPickupTime}`);
    const actualDateTime = new Date(actualPickupTime);

    pickupDelayMinutes = Math.max(
      0,
      (actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60)
    );
    isPickupOnTime = pickupDelayMinutes <= 15; // Allow 15 minutes grace period
  }

  // Calculate return on-time performance
  if (scheduledReturnTime && actualDropoffTime) {
    const scheduledDateTime = new Date(`${date}T${scheduledReturnTime}`);
    const actualDateTime = new Date(actualDropoffTime);

    returnDelayMinutes = Math.max(
      0,
      (actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60)
    );
    isReturnOnTime = returnDelayMinutes <= 15; // Allow 15 minutes grace period
  }

  // Overall on-time (both pickup and return must be on-time)
  const overallOnTime = isPickupOnTime && isReturnOnTime;

  return {
    isPickupOnTime,
    isReturnOnTime,
    pickupDelayMinutes,
    returnDelayMinutes,
    overallOnTime,
  };
}

/**
 * Calculate trip duration in minutes
 */
export function calculateTripDuration(tripData: TripTimeData): number {
  const { actualPickupTime, actualDropoffTime } = tripData;

  if (!actualPickupTime || !actualDropoffTime) {
    return 0;
  }

  const pickupTime = new Date(actualPickupTime);
  const dropoffTime = new Date(actualDropoffTime);

  return (dropoffTime.getTime() - pickupTime.getTime()) / (1000 * 60);
}

/**
 * Calculate efficiency score based on multiple factors
 */
export function calculateEfficiencyScore(
  completionRate: number,
  onTimeRate: number,
  tripFrequency: number,
  averageDelay: number = 0
): number {
  // Base weights
  const completionWeight = 0.35;
  const onTimeWeight = 0.35;
  const frequencyWeight = 0.2;
  const delayWeight = 0.1;

  // Calculate frequency score (cap at 100)
  const frequencyScore = Math.min(tripFrequency * 10, 100);

  // Calculate delay penalty (reduce score for excessive delays)
  const delayPenalty = Math.min(averageDelay / 10, 20); // Max 20 point penalty

  // Calculate final score
  const score =
    completionRate * completionWeight +
    onTimeRate * onTimeWeight +
    frequencyScore * frequencyWeight -
    delayPenalty * delayWeight;

  return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
}

/**
 * Get performance category based on efficiency score
 */
export function getPerformanceCategory(score: number): {
  category: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      category: "Excellent",
      color: "text-green-600",
      description: "Outstanding performance",
    };
  } else if (score >= 80) {
    return {
      category: "Good",
      color: "text-blue-600",
      description: "Above average performance",
    };
  } else if (score >= 70) {
    return {
      category: "Satisfactory",
      color: "text-yellow-600",
      description: "Meets expectations",
    };
  } else if (score >= 60) {
    return {
      category: "Needs Improvement",
      color: "text-orange-600",
      description: "Below expectations",
    };
  } else {
    return {
      category: "Poor",
      color: "text-red-600",
      description: "Requires immediate attention",
    };
  }
}

/**
 * Format delay time for display
 */
export function formatDelay(minutes: number): string {
  if (minutes === 0) return "On time";
  if (minutes < 60) return `${Math.round(minutes)}m late`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours}h late`;
  }
  return `${hours}h ${remainingMinutes}m late`;
}

/**
 * Check if a trip has actual time data
 */
export function hasActualTimeData(tripData: TripTimeData): boolean {
  return !!(tripData.actualPickupTime && tripData.actualDropoffTime);
}
