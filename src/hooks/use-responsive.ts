"use client";

import { useState, useEffect } from "react";

/**
 * Breakpoints matching Tailwind defaults
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Hook to detect screen size
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints | null>(null);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setBreakpoint("md");
      } else if (width >= breakpoints.sm) {
        setBreakpoint("sm");
      } else {
        setBreakpoint(null);
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if screen is at least a certain breakpoint
 */
export function useMinBreakpoint(minBreakpoint: keyof typeof breakpoints) {
  const breakpoint = useBreakpoint();
  
  if (!breakpoint) return false;
  
  const breakpointOrder: (keyof typeof breakpoints)[] = ["sm", "md", "lg", "xl", "2xl"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  const minIndex = breakpointOrder.indexOf(minBreakpoint);
  
  return currentIndex >= minIndex;
}

/**
 * Hook to check if screen is mobile
 */
export function useIsMobile() {
  return !useMinBreakpoint("md");
}

/**
 * Hook to check if screen is tablet or larger
 */
export function useIsTablet() {
  return useMinBreakpoint("md");
}

/**
 * Hook to check if screen is desktop
 */
export function useIsDesktop() {
  return useMinBreakpoint("lg");
}

