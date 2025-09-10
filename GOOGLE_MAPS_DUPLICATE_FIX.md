# Google Maps Duplicate Loading Fix

## Problem

The application was loading the Google Maps JavaScript API multiple times, causing the error:

> "You have included the Google Maps JavaScript API multiple times on this page. This may cause unexpected errors."

## Root Cause

Two components were independently loading the Google Maps API:

1. **LiveMap.tsx** - Loading basic Google Maps API (script ID: `gmaps-api-script`)
2. **LocationFields.tsx** - Loading Google Maps API with Places library (script ID: `gmaps-places`)

Both components were creating their own script tags and loading the same base API URL, causing conflicts.

## Solution

Created a centralized Google Maps loader utility (`src/lib/google-maps-loader.ts`) that:

### Features

- **Singleton Pattern**: Ensures only one instance manages Google Maps loading
- **Library Support**: Can load specific Google Maps libraries (e.g., 'places')
- **Caching**: Prevents multiple script loads for the same configuration
- **Error Handling**: Proper error handling and timeout management
- **Promise-based**: Returns promises for async loading

### Implementation

```typescript
// Load basic Google Maps
await loadGoogleMaps();

// Load Google Maps with Places library
await loadGoogleMaps({ libraries: ["places"] });

// Check if loaded
const isLoaded = isGoogleMapsLoaded(["places"]);
```

## Changes Made

### 1. Created Centralized Loader

- **File**: `src/lib/google-maps-loader.ts`
- **Purpose**: Single point of control for Google Maps API loading
- **Features**: Singleton, caching, library support, error handling

### 2. Updated LiveMap Component

- **File**: `src/components/dispatch/LiveMap.tsx`
- **Change**: Replaced custom loading logic with centralized loader
- **Before**: Custom script injection with `gmaps-api-script` ID
- **After**: Uses `loadGoogleMaps()` from centralized loader

### 3. Updated LocationFields Component

- **File**: `src/components/trips/form/LocationFields.tsx`
- **Change**: Replaced custom loading logic with centralized loader
- **Before**: Custom script injection with `gmaps-places` ID
- **After**: Uses `loadGoogleMaps({ libraries: ['places'] })` from centralized loader

## Benefits

1. **No More Duplicate Loading**: Only one Google Maps script is loaded per page
2. **Better Performance**: Reduced network requests and memory usage
3. **Consistent Loading**: All components use the same loading mechanism
4. **Error Prevention**: Centralized error handling prevents conflicts
5. **Maintainable**: Single place to manage Google Maps loading logic

## Testing

- Created test file: `src/lib/__tests__/google-maps-loader.test.ts`
- Tests singleton behavior, library detection, and error handling
- Run tests with: `npm test`

## Usage

The fix is transparent to existing code. Components continue to work as before, but now use the centralized loader internally.

### For New Components

```typescript
import { loadGoogleMaps, isGoogleMapsLoaded } from "@/lib/google-maps-loader";

// Load with specific libraries
await loadGoogleMaps({ libraries: ["places", "geometry"] });

// Check if loaded
if (isGoogleMapsLoaded(["places"])) {
  // Use Google Places API
}
```

## Verification

To verify the fix:

1. Open browser developer tools
2. Navigate to pages with maps (Dispatch, Trip forms)
3. Check Network tab - should see only one Google Maps API request
4. Check Console - should not see duplicate loading warnings
