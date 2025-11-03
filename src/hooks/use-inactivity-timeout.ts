import { useEffect, useRef, useCallback } from "react";

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  enabled?: boolean;
  onTimeout: () => void;
}

/**
 * Custom hook to automatically logout user after period of inactivity
 * Tracks user activity: mouse movement, clicks, keyboard input, scroll, touch
 */
export function useInactivityTimeout({
  timeoutMs = 10 * 60 * 1000, // 10 minutes default
  enabled = true,
  onTimeout,
}: UseInactivityTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout if enabled
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    }
  }, [timeoutMs, enabled, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initialize timer on mount
    resetTimer();

    // Activity events to track
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Throttle activity tracking to avoid excessive timer resets
    let activityThrottle: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (activityThrottle) {
        return; // Skip if throttled
      }

      activityThrottle = setTimeout(() => {
        activityThrottle = null;
        resetTimer();
      }, 1000); // Only reset timer max once per second
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (activityThrottle) {
        clearTimeout(activityThrottle);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [enabled, resetTimer]);

  // Return function to manually reset timer (useful for specific user actions)
  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}
