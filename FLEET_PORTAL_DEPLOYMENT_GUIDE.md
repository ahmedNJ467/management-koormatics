# Fleet Portal Setup Guide

## Current Status

The fleet portal has been successfully configured in the main project with:

- ✅ Fleet-specific branding and UI in `src/pages/Auth.tsx`
- ✅ Domain detection via URL parameter (`?domain=fleet`)
- ✅ Fleet-specific navigation filtering in `src/components/Sidebar.tsx`
- ✅ Fleet-specific environment variable support

## How to Access the Fleet Portal

### Option 1: URL Parameter (Currently Working)

Visit: `https://management-koormatics.vercel.app/auth?domain=fleet`

This will show the fleet portal login page with:

- Car icon and "Fleet Portal" branding
- Fleet-specific messaging
- Fleet-specific navigation items

### Option 2: Create Separate Vercel Project (Recommended)

To create a completely separate domain (`https://fleet-koormatics.vercel.app`):

1. **Go to Vercel Dashboard:**

   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import existing repository:**

   - Select "Import Git Repository"
   - Choose `ahmedNJ467/management-koormatics`
   - Select the `fleet-portal` branch

3. **Configure project:**
   - Set project name to: `fleet-koormatics`
   - Add environment variable: `NEXT_PUBLIC_APP_SUBDOMAIN` = `fleet`
   - Deploy

### Option 3: Alternative Vercel Project Creation

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import the existing repository: `ahmedNJ467/management-koormatics`
4. Set project name to: `fleet-koormatics`
5. Set environment variables:
   - `NEXT_PUBLIC_APP_SUBDOMAIN` = `fleet`
6. Deploy from the `fleet-portal` branch

## Fleet Portal Features

The fleet portal includes:

- **Fleet-specific login page** with car icon and branding
- **Filtered navigation** showing only fleet-relevant pages:
  - Dashboard
  - Vehicles
  - Drivers
  - Trips
  - Dispatch
  - Maintenance
  - Fuel Logs
  - Vehicle Inspections
  - Vehicle Incident Reports
- **Fleet-specific messaging** throughout the application
- **Same authentication system** as the main portal

## Testing the Fleet Portal

1. **Test URL parameter approach:**

   ```
   https://management-koormatics.vercel.app/auth?domain=fleet
   ```

2. **Test navigation filtering:**
   - Login with fleet credentials
   - Verify only fleet-relevant pages appear in sidebar
   - Check that branding shows "Fleet Portal"

## Next Steps

1. Choose one of the deployment options above
2. Test the fleet portal functionality
3. Configure domain settings in Vercel if using separate project
4. Update DNS if using custom domain

The fleet portal is fully functional and ready for deployment!
