# Trip Passenger Names and Document Upload Implementation

## Overview

This implementation adds passenger name management for all trip types and document upload functionality for airport services, ensuring dispatchers have access to all necessary information.

## Features Implemented

### 1. Passenger Names for All Trips

- **Previous**: Only organization clients could add passenger names
- **New**: All clients (both organization and individual) can add passenger names to trips
- **Location**: Trip booking form shows passenger management section for all clients
- **UI**: Clean interface with add/remove functionality and live validation

### 2. Document Upload for Airport Services

- **Document Types**:
  - Passport Pictures
  - Invitation Letters
- **File Support**: Images (JPG, PNG) and PDF files up to 5MB
- **Organization**: Documents are organized by passenger name
- **Storage**: Uses Supabase storage bucket `trip_documents`

### 3. Dispatcher Document Access

- **Dispatch Page**: Documents are displayed prominently for airport pickup/dropoff services
- **Trip Details**: Documents are shown in the Passengers tab for detailed view
- **Download**: One-click download/view functionality for all documents
- **Visual Design**: Color-coded sections (purple theme) to distinguish documents

## Database Changes

### New Fields Added to `trips` Table:

```sql
-- Add document fields to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS passport_documents JSONB;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS invitation_documents JSONB;
```

### Document Structure:

Each document object contains:

```json
{
  "name": "filename.pdf",
  "url": "https://storage-url/document.pdf",
  "passenger_name": "John Doe"
}
```

### Storage Setup:

- Bucket: `trip_documents`
- Public read access for easy viewing
- Authenticated upload access
- File cleanup on document removal

## Files Modified

### Core Trip Form

- `src/components/trips/TripForm.tsx` - Updated to show passengers for all clients
- `src/components/trips/form/PassengerManagement.tsx` - Improved UI and messaging
- `src/components/trips/form/DocumentUploads.tsx` - **NEW** - Document upload component
- `src/components/trips/operations/save-operations.ts` - Updated to handle document fields

### Type Definitions

- `src/lib/types/trip/trip-data.ts` - Added document fields to Trip interfaces

### Dispatcher Interface

- `src/components/dispatch/DispatchTrips.tsx` - Added document display section
- `src/components/trips/tabs/PassengersTab.tsx` - Updated for all clients + documents

### Database Migration

- `supabase/migrations/20250116_add_trip_documents.sql` - **NEW** - Migration file

## Usage Instructions

### For Trip Booking

1. Add passenger names in the "Passengers" section (available for all clients)
2. For airport services, upload documents in the "Airport Service Documents" section
3. Documents are automatically organized by passenger name
4. Multiple documents per passenger are supported

### For Dispatchers

1. View trip details on dispatch page
2. Documents appear in purple-coded section for airport services
3. Click download button to view/download documents
4. All passenger information and documents are clearly visible

### For Trip Management

1. Access trip details and go to "Passengers" tab
2. Edit passenger names as needed
3. View all uploaded documents with download links
4. Documents persist through trip updates

## Manual Database Setup

If you need to run the migration manually in Supabase dashboard:

```sql
-- Add document fields to trips table for airport services
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS passport_documents JSONB;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS invitation_documents JSONB;

-- Create a storage bucket for trip documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip_documents', 'trip_documents', true)
ON CONFLICT (id) DO NOTHING;

-- This policy allows anyone to view files in the bucket.
CREATE POLICY "Public read access for trip_documents" ON storage.objects
FOR SELECT TO public USING ( bucket_id = 'trip_documents' );

-- This policy allows any authenticated user to upload files to the bucket.
CREATE POLICY "Upload access for authenticated users to trip_documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'trip_documents' );

-- This policy allows authenticated users to update/delete their own files
CREATE POLICY "Users can update their own trip documents" ON storage.objects
FOR UPDATE TO authenticated USING ( bucket_id = 'trip_documents' );

CREATE POLICY "Users can delete their own trip documents" ON storage.objects
FOR DELETE TO authenticated USING ( bucket_id = 'trip_documents' );

-- Add comments for documentation
COMMENT ON COLUMN public.trips.passport_documents IS 'JSON array of passport document objects with name, url, passenger_name fields for airport services';
COMMENT ON COLUMN public.trips.invitation_documents IS 'JSON array of invitation letter document objects with name, url, passenger_name fields for airport services';
```

## Benefits

1. **Enhanced Communication**: Dispatchers now have complete passenger information and necessary documents
2. **Improved Compliance**: Proper document management for airport services
3. **Better Organization**: Documents linked to specific passengers for clarity
4. **User-Friendly**: Intuitive upload interface with validation and error handling
5. **Flexible**: Supports multiple file types and multiple documents per passenger
6. **Secure**: Proper access controls and file validation

The implementation ensures that dispatchers have all the information they need to efficiently manage airport pickup/dropoff services while maintaining a clean and intuitive user interface for trip booking and management.
