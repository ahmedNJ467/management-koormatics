#!/usr/bin/env tsx

/**
 * Script to test API key insertion into the database
 * Run with: npx tsx scripts/test-api-key-insert.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kgmjttamzppmypwzargk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWp0dGFtenBwbXlwd3phcmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY2MjYsImV4cCI6MjA1NTQwMjYyNn0.HMfRqxeKQSjRY2ydzyxuJoTqr06nTVjOmGp0TpXtYpk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiKeyInsertion() {
  try {
    console.log("🔄 Testing API key insertion...");

    // First, try to check if the table exists
    const { data: _tableCheck, error: tableError } = await supabase
      .from("api_keys")
      .select("id")
      .limit(1);

    if (tableError) {
      console.error(
        "❌ Table api_keys does not exist or is not accessible:",
        tableError.message
      );
      console.log(
        "💡 Please run the SQL script in the Supabase dashboard first:"
      );
      console.log("   File: supabase/insert-google-maps-key.sql");
      return;
    }

    console.log("✅ Table api_keys exists and is accessible");

    // Use upsert with the name field as the conflict target
    const { data, error } = await supabase
      .from("api_keys")
      .upsert(
        {
          name: "google_maps",
          key_value: "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY",
          permissions: ["maps", "geocoding", "places", "routing"],
          is_active: true,
          expires_at: null,
        },
        {
          onConflict: "name",
        }
      )
      .select();

    if (error) {
      console.error("❌ Error inserting API key:", error);
      return;
    }

    console.log("✅ Google Maps API key successfully inserted/updated!");
    console.log("📋 Details:", {
      name: data[0]?.name,
      is_active: data[0]?.is_active,
      permissions: data[0]?.permissions,
      created_at: data[0]?.created_at,
    });

    // Test retrieval
    const { data: retrievedKey, error: retrieveError } = await supabase
      .from("api_keys")
      .select("name, key_value, is_active")
      .eq("name", "google_maps")
      .single();

    if (retrieveError) {
      console.error("❌ Error retrieving API key:", retrieveError);
      return;
    }

    console.log("✅ API key retrieval test successful:", {
      name: retrievedKey.name,
      key_preview: retrievedKey.key_value.substring(0, 20) + "...",
      is_active: retrievedKey.is_active,
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
testApiKeyInsertion();
