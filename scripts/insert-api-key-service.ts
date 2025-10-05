#!/usr/bin/env tsx

/**
 * Script to insert Google Maps API key into the database using service role
 * Run with: npx tsx scripts/insert-api-key-service.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgmjttamzppmypwzargk.supabase.co';
// Using service role key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWp0dGFtenBwbXlwd3phcmdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTgyNjYyNiwiZXhwIjoyMDU1NDAyNjI2fQ.YourServiceRoleKeyHere';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function insertGoogleMapsApiKey() {
  try {
    console.log('🔄 Inserting Google Maps API key into database using service role...');

    // First, try to delete any existing entry with the same name
    await supabase
      .from('api_keys')
      .delete()
      .eq('name', 'google_maps');

    // Then insert the new entry
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name: 'google_maps',
        key_value: 'AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY',
        permissions: ['maps', 'geocoding', 'places', 'routing'],
        is_active: true,
        expires_at: null,
      })
      .select();

    if (error) {
      console.error('❌ Error inserting API key:', error);
      return;
    }

    console.log('✅ Google Maps API key successfully inserted/updated!');
    console.log('📋 Details:', {
      name: data[0]?.name,
      is_active: data[0]?.is_active,
      permissions: data[0]?.permissions,
      created_at: data[0]?.created_at,
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertGoogleMapsApiKey();
