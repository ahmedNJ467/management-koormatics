# Fleet-Koormatics Portal Setup

## Overview
The fleet-koormatics portal is designed specifically for fleet managers and provides access to core fleet management functionality.

## Accessing the Fleet Portal

### Production (Vercel)
- **URL**: `https://fleet-koormatics.vercel.app`
- **Domain**: `fleet-koormatics.vercel.app`

### Local Development
- **URL**: `http://fleet.localhost:8080` (if configured)
- **Domain**: `fleet` (detected from subdomain)

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
- `src/utils/subdomain.ts` - Domain detection
- `src/components/Sidebar.tsx` - Navigation allowlist
- `src/hooks/use-tenant-scope.ts` - Role-based access

## Deployment
The fleet portal is automatically deployed when changes are pushed to the main branch. Vercel will create the `fleet-koormatics.vercel.app` subdomain automatically.
