/**
 * React Optimization Utilities
 * Helpers for reducing re-renders and optimizing performance
 */

import { memo, ComponentType, ComponentProps } from "react";

/**
 * Create a memoized component with custom comparison
 */
export function createMemoizedComponent<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (
    prevProps: ComponentProps<T>,
    nextProps: ComponentProps<T>
  ) => boolean
): T {
  return memo(Component, areEqual) as T;
}

/**
 * Shallow compare props (for memo comparison)
 */
export function shallowEqual<T extends Record<string, any>>(
  obj1: T,
  obj2: T
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep compare props (for expensive comparisons)
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    obj1 == null ||
    obj2 == null ||
    typeof obj1 !== "object" ||
    typeof obj2 !== "object"
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if an object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}

/**
 * Get stable reference for object (useful for memoization)
 */
export function getStableRef<T>(value: T): T {
  // For objects/arrays, return a stable reference if empty
  if (isEmpty(value)) {
    return (Array.isArray(value) ? [] : {}) as T;
  }
  return value;
}

