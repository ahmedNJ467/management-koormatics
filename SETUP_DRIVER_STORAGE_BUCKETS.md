# Setup Driver Storage Buckets

The driver file upload feature requires three storage buckets to be created in Supabase. Due to RLS (Row Level Security) restrictions, it's easier to create these buckets manually through the Supabase Dashboard.

## Quick Setup (Recommended)

### Option 1: Create Buckets via Supabase Dashboard (Easiest)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Create each bucket with the following settings:

#### Bucket 1: `driver-avatars`
- **Name**: `driver-avatars`
- **Public bucket**: ✅ **Enabled** (check this box)
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`

#### Bucket 2: `driver-documents`
- **Name**: `driver-documents`
- **Public bucket**: ✅ **Enabled** (check this box)
- **File size limit**: `10485760` (10 MB)
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Bucket 3: `driver-airport-ids`
- **Name**: `driver-airport-ids`
- **Public bucket**: ✅ **Enabled** (check this box)
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Option 2: Run the Migration

If you prefer to use the migration file:

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20250150_create_driver_storage_buckets.sql`
3. Click **Run**

**Note**: If the migration fails due to RLS policies, use Option 1 instead.

## Verify Setup

After creating the buckets, verify they exist:

1. Go to **Storage** in Supabase Dashboard
2. You should see all three buckets listed:
   - `driver-avatars`
   - `driver-documents`
   - `driver-airport-ids`

## RLS Policies

The migration file also sets up RLS (Row Level Security) policies that allow authenticated users to:
- View files in these buckets
- Upload files to these buckets
- Update files in these buckets
- Delete files from these buckets

If you created the buckets manually, make sure to run the RLS policies section from the migration file, or the policies will be created automatically when you run the migration.

## Troubleshooting

If you still get "Bucket not found" errors after creating the buckets:

1. **Refresh your browser** - Sometimes the cache needs to be cleared
2. **Check bucket names** - Make sure they match exactly: `driver-avatars`, `driver-documents`, `driver-airport-ids`
3. **Verify public access** - Ensure "Public bucket" is enabled for all three buckets
4. **Check RLS policies** - Run the RLS policies section from the migration file if you created buckets manually

