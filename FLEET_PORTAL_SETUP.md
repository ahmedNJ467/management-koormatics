# Fleet-Koormatics Portal Setup

## Overview

The fleet-koormatics portal is designed specifically for fleet managers and provides access to core fleet management functionality.

## Accessing the Fleet Portal

### Production (Vercel)

- **URL**: `https://management-koormatics.vercel.app?domain=fleet`
- **Alternative**: `https://management-koormatics.vercel.app` (then add `?domain=fleet` to any URL)

### Local Development

- **URL**: `http://localhost:8080?domain=fleet`
- **Domain**: Detected from URL parameter `domain=fleet`

## Available Pages

The fleet portal includes only the following pages:

1. **Dashboard** - Overview and analytics
2. **Vehicles** - Fleet vehicle management
3. **Drivers** - Driver management and profiles
4. **Maintenance** - Vehicle maintenance scheduling and tracking
5. **Fuel Logs** - Fuel consumption tracking
6. **Spare Parts** - Inventory management
7. **Vehicle Inspections** - Inspection scheduling and records
8. **Incident Reports** - Vehicle incident reporting
9. **Settings** - Portal configuration

## User Access

- **Role Required**: `fleet_manager`
- **Authentication**: Same as main management portal
- **Permissions**: Fleet-specific pages only

## Configuration

The fleet domain is configured in:

- `src/utils/subdomain.ts` - Domain detection (supports URL parameters)
- `src/components/Sidebar.tsx` - Navigation allowlist
- `src/hooks/use-tenant-scope.ts` - Role-based access

## How to Use

1. Go to `https://management-koormatics.vercel.app?domain=fleet`
2. Login with your fleet manager credentials
3. You'll see only the fleet management pages in the navigation

## Deployment

The fleet portal is automatically deployed when changes are pushed to the main branch. The URL parameter approach allows access without needing separate Vercel projects.
