import { useEffect, useRef, useCallback } from "react";

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  enabled?: boolean;
  onTimeout: () => void;
}

/**
 * Custom hook to automatically logout user after period of inactivity
 * Tracks user activity: mouse movement, clicks, keyboard input, scroll, touch
 * Works even when computer goes to sleep by checking actual elapsed time
 */
export function useInactivityTimeout({
  timeoutMs = 10 * 60 * 1000, // 10 minutes default
  enabled = true,
  onTimeout,
}: UseInactivityTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  const timeoutMsRef = useRef(timeoutMs);

  // Keep refs updated
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    timeoutMsRef.current = timeoutMs;
  }, [onTimeout, timeoutMs]);

  // Check if timeout has been exceeded using actual elapsed time
  const checkTimeout = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const elapsed = now - lastActivityRef.current;

    if (elapsed >= timeoutMsRef.current) {
      // Timeout exceeded, trigger logout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onTimeoutRef.current();
    }
  }, [enabled]);

  const resetTimer = useCallback(() => {
    // Clear existing timeout and interval
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout if enabled
    if (enabled) {
      // Use setTimeout as primary mechanism (more efficient)
      timeoutRef.current = setTimeout(() => {
        checkTimeout();
      }, timeoutMsRef.current);

      // Use interval as backup to check actual elapsed time
      // This catches cases where setTimeout was paused (e.g., computer sleep)
      // Check every minute to catch sleep scenarios without being too resource-intensive
      intervalRef.current = setInterval(() => {
        checkTimeout();
      }, 60 * 1000); // Check every minute
    }
  }, [enabled, checkTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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

    // Handle page visibility changes (e.g., tab becomes visible after sleep)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible, check if timeout exceeded
        checkTimeout();
        // Reset timer if still within timeout (user might have been active in another tab)
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed < timeoutMsRef.current) {
          resetTimer();
        }
      }
    };

    // Handle window focus (another way to detect when page regains focus)
    const handleFocus = () => {
      checkTimeout();
      // Reset timer if still within timeout
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed < timeoutMsRef.current) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityThrottle) {
        clearTimeout(activityThrottle);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, resetTimer, checkTimeout]);

  // Return function to manually reset timer (useful for specific user actions)
  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}
