/**
 * Tests for Google Maps Loader
 */

import {
  googleMapsLoader,
  loadGoogleMaps,
  isGoogleMapsLoaded,
} from "../google-maps-loader";

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "test-api-key";

  // Clear any existing Google Maps from window
  delete (window as any).google;
});

afterEach(() => {
  process.env = originalEnv;
  delete (window as any).google;
});

describe("Google Maps Loader", () => {
  it("should be a singleton", () => {
    const instance1 = googleMapsLoader;
    const instance2 = googleMapsLoader;
    expect(instance1).toBe(instance2);
  });

  it("should detect when Google Maps is already loaded", () => {
    // Mock Google Maps as already loaded
    (window as any).google = {
      maps: {
        Map: jest.fn(),
        places: {},
      },
    };

    expect(isGoogleMapsLoaded()).toBe(true);
    expect(isGoogleMapsLoaded(["places"])).toBe(true);
  });

  it("should detect when required libraries are missing", () => {
    // Mock Google Maps without places library
    (window as any).google = {
      maps: {
        Map: jest.fn(),
      },
    };

    expect(isGoogleMapsLoaded()).toBe(true);
    expect(isGoogleMapsLoaded(["places"])).toBe(false);
  });

  it("should handle missing API key", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "";

    await expect(loadGoogleMaps()).rejects.toThrow(
      "Google Maps API key not found"
    );
  });
});
